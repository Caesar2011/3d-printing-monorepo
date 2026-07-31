import type { FC } from 'react'
import { V } from '@jsxcad/core'

import { Cuboid } from '../primitives/index.js'
import type { ShapeContextType } from '../shape/ShapeContext.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { Edge } from '../primitives/Cuboid.js'
import { SvgShape } from '../svg/SvgShape.js'

import type { CutoutSettings, ContainerProps, SideFaceName } from './types.js'
import type { FaceCutoutMap, ResolvedCutout } from './cutout-geometry.js'
import { computeCellCutoutPlacements } from './cutout-geometry.js'
import { computeCavityCells } from './cavity-layout.js'
import type { ContainerContextType } from './ContainerContext.js'
import { useContainerContext } from './ContainerContext.js'
import { CutoutFace } from './CutoutFace.js'
import {
  ScoopedCavity,
  computeScoopWidth,
  validateScoopFit,
  determineScoopAxis,
  validateEmbossBottom,
} from './scoop-geometry.js'

const SIDE_FACES: readonly SideFaceName[] = ['front', 'left', 'back', 'right'] as const

/** Merges cutout settings: context defaults → side shorthand → face-specific overrides */
function resolveCutouts(defaults: Required<CutoutSettings>, cutoutProps?: ContainerProps['cutout']): FaceCutoutMap {
  if (!cutoutProps) return {}

  const result: FaceCutoutMap = {}
  const sideDefaults = cutoutProps.side

  for (const face of SIDE_FACES) {
    const faceSettings = cutoutProps[face]
    if (faceSettings === undefined && sideDefaults === undefined) continue

    result[face] = {
      ...defaults,
      ...sideDefaults,
      ...faceSettings,
    } as ResolvedCutout
  }

  if (cutoutProps.bottom !== undefined) {
    result.bottom = { ...defaults, ...cutoutProps.bottom } as ResolvedCutout
  }

  return result
}

function hasCutouts(cutoutProps?: ContainerProps['cutout']): boolean {
  if (!cutoutProps) return false
  return (
    cutoutProps.bottom !== undefined ||
    cutoutProps.side !== undefined ||
    SIDE_FACES.some((face) => cutoutProps[face] !== undefined)
  )
}

export function resolveContainerConfig(
  options: Omit<ContainerProps, 'size'>,
  containerCtx: ContainerContextType,
  shapeCtx: ShapeContextType,
) {
  const scoop = options.scoop ?? false
  const containerRadius = options.radius ?? containerCtx.radius
  const containerEdges = options.edges ?? containerCtx.edges
  const containerCutoutEdges = containerEdges | (options.cutoutEdges ?? containerCtx.cutoutEdges)
  const wall = options.wall ?? shapeCtx.wall
  const floor = shapeCtx.floor
  const scoopFactor = containerCtx.scoopFactor
  const maxEmbossSize = V(options.maxEmbossSize ?? containerCtx.maxEmbossSize)
  return { scoop, containerRadius, containerEdges, containerCutoutEdges, wall, floor, scoopFactor, maxEmbossSize }
}

export const Container: FC<ContainerProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()
  const { scoop, containerRadius, containerEdges, containerCutoutEdges, wall, floor, scoopFactor, maxEmbossSize } =
    resolveContainerConfig(options, containerCtx, shapeCtx)

  if (scoop && hasCutouts(options.cutout)) {
    throw new Error('Cannot use scoop and cutouts simultaneously. Enable only one of the two.')
  }

  const dim = V(size)
  const innerRadius = Math.max(0, containerRadius - wall)
  const resolvedCutouts = resolveCutouts(containerCtx.cutout, options.cutout)

  const innerOrigin = V([wall, wall, floor])
  const innerSize = V([dim.x - 2 * wall, dim.y - 2 * wall, dim.z - floor])
  const cells = computeCavityCells(innerOrigin, innerSize, wall, options.divisions)

  // Validate scoop fit for every cell that inherits or enables it.
  for (const cell of cells) {
    if (cell.scoop ?? scoop) {
      const scoopWidth = computeScoopWidth(cell.size.z, scoopFactor)
      validateScoopFit(cell, scoopWidth)
    }
  }

  for (const cell of cells) {
    validateEmbossBottom(cell, resolvedCutouts.bottom === undefined)
  }

  const allCutoutPlacements = cells.flatMap((cell) =>
    (cell.scoop ?? scoop)
      ? []
      : computeCellCutoutPlacements(cell, dim, wall, floor, containerRadius, containerCutoutEdges, resolvedCutouts),
  )
  return (
    <subtract>
      <Cuboid size={size} edges={containerEdges} radius={containerRadius} />

      {cells.map((cell, idx) => {
        const cellScoop = cell.scoop ?? scoop
        let embossSize = V({ xy: maxEmbossSize.min(cell.size), z: maxEmbossSize })
        const scoopWidth = cellScoop ? computeScoopWidth(cell.size.z, scoopFactor) : 0
        if (cellScoop) {
          const axis = determineScoopAxis(cell)
          embossSize = embossSize.s({ [axis]: scoopWidth * 2, [axis === 'x' ? 'y' : 'x']: innerRadius * 2 })
        } else if ((containerCutoutEdges & Edge.BOT) !== 0) {
          embossSize = embossSize.s({ xy: innerRadius * 2 })
        }

        return (
          <translate by={cell.offset} key={`cavity-${idx}`}>
            {cellScoop ? (
              <ScoopedCavity
                size={cell.size}
                scoopWidth={scoopWidth}
                radius={innerRadius}
                edges={containerCutoutEdges & ~Edge.TOP}
              />
            ) : (
              <Cuboid size={cell.size} edges={containerCutoutEdges & ~Edge.TOP} radius={innerRadius} />
            )}
            {cell.embossSrc !== undefined && (
              <translate by={{ xy: cell.size.s(embossSize).d(2), z: -embossSize.z }}>
                <SvgShape file={cell.embossSrc} size={embossSize.a({ z: 0.1 })} />
              </translate>
            )}
          </translate>
        )
      })}

      {allCutoutPlacements.map((placement, idx) => (
        <translate by={placement.translation} key={`cutout-${idx}`}>
          <rotate by={placement.rotation}>
            <CutoutFace size={placement.size} settings={placement.settings} />
          </rotate>
        </translate>
      ))}
    </subtract>
  )
}
