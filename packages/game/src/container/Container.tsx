import type { FC } from 'react'
import { V } from '@jsxcad/core'

import { Cuboid } from '../primitives/index.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings, ContainerProps, SideFaceName } from './types.js'
import type { FaceCutoutMap, ResolvedCutout } from './cutout-geometry.js'
import { computeCellCutoutPlacements } from './cutout-geometry.js'
import { computeCavityCells } from './cavity-layout.js'
import { useContainerContext } from './ContainerContext.js'
import { CutoutFace } from './CutoutFace.js'

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
      ...(sideDefaults ?? {}),
      ...(faceSettings ?? {}),
    } as ResolvedCutout
  }

  if (cutoutProps.bottom !== undefined) {
    result.bottom = { ...defaults, ...cutoutProps.bottom } as ResolvedCutout
  }

  return result
}

export const Container: FC<ContainerProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()

  const containerRadius = options.radius ?? containerCtx.radius
  const containerEdges = options.edges ?? containerCtx.edges
  const containerCutoutEdges = containerEdges | (options.cutoutEdges ?? containerCtx.cutoutEdges)
  const wall = shapeCtx.wall
  const floor = shapeCtx.floor

  const dim = V(size)
  const innerRadius = Math.max(0, containerRadius - wall)
  const resolvedCutouts = resolveCutouts(containerCtx.cutout, options.cutout)

  const innerOrigin = V([wall, wall, floor])
  const innerSize = V([dim.x - 2 * wall, dim.y - 2 * wall, dim.z - floor])
  const cells = computeCavityCells(innerOrigin, innerSize, wall, options.divisions)

  const allCutoutPlacements = cells.flatMap((cell) =>
    computeCellCutoutPlacements(cell, dim, wall, floor, containerRadius, containerCutoutEdges, resolvedCutouts),
  )

  return (
    <subtract>
      <Cuboid size={size} edges={containerEdges} radius={containerRadius} />

      {cells.map((cell, idx) => (
        <translate by={cell.offset} key={`cavity-${idx}`}>
          <Cuboid size={cell.size} edges={containerCutoutEdges & ~Edge.TOP} radius={innerRadius} />
        </translate>
      ))}

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
