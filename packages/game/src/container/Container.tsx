import type { FC } from 'react'
import { V } from '@jsxcad/core'

import { Cuboid } from '../primitives/index.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings, ContainerProps } from './types.js'
import type { ResolvedCutout } from './cutout-geometry.js'
import { computeCutoutPlacements } from './cutout-geometry.js'
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

    // Face is requested: merge defaults → side → face-specific
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
  const placements = computeCutoutPlacements(dim, wall, floor, containerRadius, containerEdges, resolvedCutouts)

  return (
    <subtract>
      {/* Outer shell */}
      <Cuboid size={size} edges={containerEdges} radius={containerRadius} />

      {/* Inner cavity */}
      <translate by={{ xy: wall, z: floor }}>
        <Cuboid size={dim.s({ xy: wall * 2, z: floor })} edges={containerEdges & ~Edge.TOP} radius={innerRadius} />
      </translate>

      {/* Cutout holes: subtract each face */}
      {placements.map((placement, idx) => (
        <translate by={placement.translation} key={idx}>
          <rotate by={placement.rotation}>
            <CutoutFace size={placement.size} settings={placement.settings} />
          </rotate>
        </translate>
      ))}
    </subtract>
  )
}
