import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { Cuboid, Edge } from '../primitives/index.js'

import { CardContainerCutout } from './CardContainerCutout.js'

interface DividerProps {
  size: AxisRecordDefinition
  filletRadius: number
  armInset: number
  armHeight: number
  fingerCutoutDiameter?: number
}

/**
 * A single divider piece that slots into the container.
 *
 * Anatomy (side view, looking along Y):
 *
 *   ┌─arm─┐           ┌─arm─┐
 *   │     ╰───────────╯     │  ← armHeight (upper region with cutout)
 *   │                       │
 *   └── armInset ──┘  └─────┘  ← body (full width minus inset on each side)
 */
export const Divider: FC<DividerProps> = ({
  size: sizeDef,
  filletRadius,
  armInset,
  armHeight,
  fingerCutoutDiameter,
}) => {
  const size = V(sizeDef)
  const bodyHeight = size.z - armHeight

  const armWidth = fingerCutoutDiameter !== undefined ? (size.x - fingerCutoutDiameter) / 2 : undefined

  if (armWidth !== undefined && armWidth < armInset * 2) {
    throw Error(`Arm width must be at least ${armInset * 2}mm (at least twice the arm inset / wall thickness).`)
  }

  if (fingerCutoutDiameter !== undefined && fingerCutoutDiameter > size.z) {
    throw Error(
      `Finger cutout diameter must be at most ${size.z}mm, got ${fingerCutoutDiameter}mm (radius at most half the height).`,
    )
  }

  return (
    <subtract>
      <union>
        {/* Upper arms (left and right, or full width with no cutout) */}
        <translate by={{ z: bodyHeight }}>
          <Cuboid
            size={{ x: size.x, y: size.y, z: armHeight }}
            radius={filletRadius}
            edges={Edge.TOP & (Edge.LEFT | Edge.RIGHT)}
          />
        </translate>

        {/* Body (inset from both sides) */}
        <translate by={{ x: armInset }}>
          <Cuboid
            size={{
              x: size.x - armInset * 2,
              y: size.y,
              z: size.z - filletRadius,
            }}
          />
        </translate>
      </union>
      {fingerCutoutDiameter !== undefined && armWidth !== undefined && (
        <CardContainerCutout
          containerSize={size}
          fingerCutoutDiameter={fingerCutoutDiameter}
          armWidth={armWidth}
          filletRadius={filletRadius}
        />
      )}
    </subtract>
  )
}
