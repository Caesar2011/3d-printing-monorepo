import type { FC } from 'react'
import { V } from '@jsxcad/core'

import { Cuboid } from '../primitives/index.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings, ContainerProps } from './types.js'
import type { ResolvedCutout } from './cutout-geometry.js'
import { computeCellCutoutPlacements } from './cutout-geometry.js'
import { computeCavityCells } from './cavity-layout.js'
import { CutoutFace } from './CutoutFace.js'
import { useContainerContext } from './ContainerContext.js'

/** Merges cutout settings: context defaults → side shorthand → face-specific overrides */
function resolveCutouts(
  defaults: Required<CutoutSettings>,
  cutoutProps?: ContainerProps['cutout'],
): Partial<Record<'bottom' | 'front' | 'left' | 'back' | 'right', ResolvedCutout>> {
  if (!cutoutProps) return {}

  const result: Partial<Record<'bottom' | 'front' | 'left' | 'back' | 'right', ResolvedCutout>> = {}
  const sideDefaults = cutoutProps.side

  const faces = ['front', 'left', 'back', 'right'] as const
  for (const face of faces) {
    const faceSettings = cutoutProps[face]
    if (faceSettings === undefined && sideDefaults === undefined) continue

    result[face] = {
      ...defaults,
      ...(sideDefaults ?? {}),
      ...(faceSettings ?? {}),
    } as ResolvedCutout
  }

  if (cutoutProps.bottom !== undefined) {
    result.bottom = {
      ...defaults,
      ...(cutoutProps.bottom ?? {}),
    } as ResolvedCutout
  }

  return result
}

export const Container: FC<ContainerProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()

  const containerRadius = options.radius ?? containerCtx.radius
  const containerEdges = options.edges ?? containerCtx.edges
  const wall = shapeCtx.wall
  const floor = shapeCtx.floor

  const dim = V(size)
  const innerRadius = Math.max(0, containerRadius - wall)

  const resolvedCutouts = resolveCutouts(containerCtx.cutout, options.cutout)

  // Compute cavity cells from divisions
  const innerOrigin = V([wall, wall, floor])
  const innerSize = V([dim.x - 2 * wall, dim.y - 2 * wall, dim.z - floor])
  const cells = computeCavityCells(innerOrigin, innerSize, wall, options.divisions)

  // Compute cutout placements per cell
  const allCutoutPlacements = cells.flatMap((cell) =>
    computeCellCutoutPlacements(cell, dim, wall, floor, containerRadius, containerEdges, resolvedCutouts),
  )

  return (
    <subtract>
      {/* Outer shell */}
      <Cuboid size={size} edges={containerEdges} radius={containerRadius} />

      {/* Inner cavities: one per cell */}
      {cells.map((cell, idx) => (
        <translate by={cell.offset} key={`cavity-${idx}`}>
          <Cuboid size={cell.size} edges={containerEdges & ~Edge.TOP} radius={innerRadius} />
        </translate>
      ))}

      {/* Cutout holes per cell */}
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
