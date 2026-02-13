import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'
import type { FC } from 'react'
import { range } from '@jsxcad/utils'

import { Cylinder } from './Cylinder.js'
import { Sphere } from './Sphere.js'
import { PrimitiveContextProvider, usePrimitiveContext } from './PrimitiveContext.js'

export enum CylinderEdge {
  TOP = 0b10,
  BOT = 0b01,
  ALL = 0b11,
  NONE = 0b00,
}

/** A cylinder with rounded (filleted) top and/or bottom circular edges. */
export const RoundedCylinder: FC<{
  size: AxisRecordDefinition
  radius?: number
  edges?: CylinderEdge
  segments?: number
}> = ({ size, radius = 0, edges = CylinderEdge.ALL, segments }) => {
  const dim = V(size)
  const cylRadius = dim.x / 2
  const cylHeight = dim.z
  const resolvedSegments = segments ?? usePrimitiveContext().cylinderSegments

  if (radius <= 0 || edges === CylinderEdge.NONE) {
    return <Cylinder size={size} segments={resolvedSegments} />
  }

  validateFilletRadius(radius, cylRadius, cylHeight)

  const roundBot = (edges & CylinderEdge.BOT) !== 0
  const roundTop = (edges & CylinderEdge.TOP) !== 0
  const coreBottom = roundBot ? radius : 0
  const coreTop = roundTop ? cylHeight - radius : cylHeight
  const ringRadius = cylRadius - radius

  return (
    <PrimitiveContextProvider sphereSegments={resolvedSegments}>
      <intersect>
        <Cylinder size={size} segments={resolvedSegments} />
        <union>
          <translate by={{ z: coreBottom }}>
            <Cylinder size={{ xy: dim.x, z: coreTop - coreBottom }} segments={resolvedSegments} />
          </translate>
          {roundBot && (
            <TorusRing
              ringRadius={ringRadius}
              filletRadius={radius}
              cylRadius={cylRadius}
              z={radius}
              segments={resolvedSegments}
            />
          )}
          {roundTop && (
            <TorusRing
              ringRadius={ringRadius}
              filletRadius={radius}
              cylRadius={cylRadius}
              z={cylHeight - radius}
              segments={resolvedSegments}
            />
          )}
        </union>
      </intersect>
    </PrimitiveContextProvider>
  )
}

/**
 * A torus approximated by hulling spheres placed around a circle.
 *
 * The ring lies in the XY plane at height `z`, centered on the cylinder axis
 * at `(cylRadius, cylRadius)` with the given `ringRadius`.
 */
const TorusRing: FC<{
  ringRadius: number
  filletRadius: number
  cylRadius: number
  z: number
  segments: number
}> = ({ ringRadius, filletRadius, cylRadius, z, segments }) => {
  const diameter = filletRadius * 2

  return (
    <hull>
      {range(segments + 1).map((i) => {
        const angle = (2 * Math.PI * i) / segments
        return (
          <Sphere
            key={i}
            size={diameter}
            center={{
              x: cylRadius + ringRadius * Math.cos(angle),
              y: cylRadius + ringRadius * Math.sin(angle),
              z,
            }}
          />
        )
      })}
    </hull>
  )
}

function validateFilletRadius(radius: number, cylRadius: number, cylHeight: number): void {
  if (radius > cylRadius)
    throw new RangeError(`Fillet radius (${radius}) must not exceed cylinder radius (${cylRadius})`)
  if (radius > cylHeight / 2)
    throw new RangeError(`Fillet radius (${radius}) must not exceed half the cylinder height (${cylHeight / 2})`)
}
