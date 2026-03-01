import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { Cuboid, Fillet } from '../primitives/index.js'

interface DividerSlotCutoutProps {
  size: AxisRecordDefinition
  filletRadius: number
}

/**
 * A single slot cutout subtracted from the container wall to accept a divider arm.
 * The slot is a cuboid with filleted top edges (left and right).
 */
export const DividerSlotCutout: FC<DividerSlotCutoutProps> = ({ size, filletRadius }) => {
  const slotSize = V(size)

  return (
    <union>
      {/* Left fillet at the top-back of the slot */}
      <translate by={{ yz: slotSize }}>
        <rotate by={{ y: Math.PI / 2 }}>
          <Fillet size={{ z: slotSize.x, xy: filletRadius }} />
        </rotate>
      </translate>

      {/* Right fillet at the top-front of the slot */}
      <translate by={{ xz: slotSize }}>
        <rotate by={{ y: Math.PI / 2, z: Math.PI }}>
          <Fillet size={{ z: slotSize.x, xy: filletRadius }} />
        </rotate>
      </translate>

      {/* Main slot volume */}
      <Cuboid size={size} />
    </union>
  )
}
