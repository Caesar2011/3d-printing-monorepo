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
    return <Cuboid size={size} radius={borderRadius} edges={Edge.SIDE} />
  }

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
