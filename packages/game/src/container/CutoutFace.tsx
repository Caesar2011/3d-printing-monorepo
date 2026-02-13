import type { FC } from 'react'
import type { Vector3 } from '@jsxcad/core'

import { HexGrid } from '../primitives/HexGrid.js'
import { Cuboid, Edge } from '../primitives/Cuboid.js'

import type { ResolvedCutout } from './cutout-geometry.js'
import { CutoutType } from './types.js'

/** Renders a single cutout face to be subtracted from the container wall. */
export const CutoutFace: FC<{
  size: Vector3
  settings: ResolvedCutout
}> = ({ size, settings }) => {
  const { borderRadius } = settings

  if (settings.type === CutoutType.EMPTY) {
    // Fully open: just the hole shape
    return <Cuboid size={size} radius={borderRadius} edges={Edge.SIDE} />
  }

  // Grid cutout: cut the full area, then put grid back
  // We subtract this whole component from the wall, so we need to produce
  // the shape of "wall minus grid". That means: the hole shape minus the grid bars.
  return (
    <subtract>
      <Cuboid size={size} radius={borderRadius} edges={Edge.SIDE} />
      <HexGrid
        size={size}
        hexInnerDiameter={settings.hexInnerDiameter}
        hexWidth={settings.hexWidth}
        center={settings.center}
      />
    </subtract>
  )
}
