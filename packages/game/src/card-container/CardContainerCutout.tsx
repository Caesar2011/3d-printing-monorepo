import type { FC } from 'react'
import type { Vector3 } from '@jsxcad/core'

import { Cuboid, Cylinder, Fillet } from '../primitives/index.js'

interface CardContainerCutoutProps {
  containerSize: Vector3
  fingerCutoutDiameter: number
  armWidth: number
  filletRadius: number
}

/**
 * The finger-scoop cutout subtracted from the top of the container.
 * This creates the curved channel running along the Y axis that allows
 * cards to be lifted out.
 */
export const CardContainerCutout: FC<CardContainerCutoutProps> = ({
  containerSize,
  fingerCutoutDiameter,
  armWidth,
  filletRadius,
}) => (
  <>
    {/* Main cylindrical channel along Y */}
    <translate
      by={{
        x: containerSize.x / 2 - fingerCutoutDiameter / 2,
        y: containerSize.y,
        z: containerSize.z - fingerCutoutDiameter / 2 - filletRadius,
      }}
    >
      <rotate by={{ x: Math.PI / 2 }}>
        <Cylinder size={{ xy: fingerCutoutDiameter, z: containerSize.y }} />
      </rotate>
    </translate>

    {/* Left fillet where channel meets the top surface */}
    <translate by={{ x: armWidth, z: containerSize.z }}>
      <rotate by={{ y: Math.PI / 2, z: Math.PI / 2 }}>
        <Fillet size={{ xy: filletRadius, z: containerSize.y }} />
      </rotate>
    </translate>

    {/* Right fillet where channel meets the top surface */}
    <translate by={{ x: containerSize.x - armWidth, y: containerSize.y, z: containerSize.z }}>
      <rotate by={{ y: Math.PI / 2, z: -Math.PI / 2 }}>
        <Fillet size={{ xy: filletRadius, z: containerSize.y }} />
      </rotate>
    </translate>

    {/* Flat strip connecting the two fillets across the top */}
    <translate by={{ x: armWidth, z: containerSize.z - filletRadius }}>
      <Cuboid size={{ x: containerSize.x - 2 * armWidth, y: containerSize.y, z: filletRadius }} />
    </translate>
  </>
)
