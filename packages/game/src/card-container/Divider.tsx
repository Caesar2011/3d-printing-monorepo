import type { AxisRecordDefinition } from '@jsxcad/core/dist/Vector3.js'
import { V } from '@jsxcad/core/dist/Vector3.js'

import { Cuboid, Cylinder, Edge } from '../primitives/index.js'

interface DividerCutoutProps {
  dim: AxisRecordDefinition
  upperFiletRadius: number
  wall: number
  upperHeight: number
  cutoutDiameter?: number
}

export const Divider = ({ dim, upperFiletRadius, wall, upperHeight, cutoutDiameter }: DividerCutoutProps) => {
  const size = V(dim)
  const lowerHeight = size.z - upperHeight

  const upperWidth = cutoutDiameter !== undefined ? (size.x - cutoutDiameter) / 2 : undefined

  if (upperWidth !== undefined && upperWidth < wall * 2) {
    throw Error(`Upper width must be at least ${wall * 2}mm (at least twice the wall thickness).`)
  }

  if (cutoutDiameter !== undefined && cutoutDiameter > size.z) {
    throw Error(
      `Cutout diameter must be at most ${size.z}mm, got ${cutoutDiameter}mm (radius at most half the height).`,
    )
  }

  return (
    <subtract>
      <union>
        {upperWidth === undefined ? (
          <translate by={{ z: lowerHeight }}>
            <Cuboid
              size={{
                x: size.x,
                y: size.y,
                z: upperHeight,
              }}
              radius={upperFiletRadius}
              edges={Edge.TOP & (Edge.LEFT | Edge.RIGHT)}
            />
          </translate>
        ) : (
          <>
            <translate by={{ z: lowerHeight }}>
              <Cuboid
                size={{
                  x: upperWidth,
                  y: size.y,
                  z: upperHeight,
                }}
                radius={upperFiletRadius}
                edges={Edge.TOP & (Edge.LEFT | Edge.RIGHT)}
              />
            </translate>
            <translate by={{ x: size.x - upperWidth, z: lowerHeight }}>
              <Cuboid
                size={{
                  x: upperWidth,
                  y: size.y,
                  z: upperHeight,
                }}
                radius={upperFiletRadius}
                edges={Edge.TOP & (Edge.LEFT | Edge.RIGHT)}
              />
            </translate>
          </>
        )}

        <translate by={{ x: wall }}>
          <Cuboid
            size={{
              x: size.x - wall * 2,
              y: size.y,
              z: size.z - upperFiletRadius,
            }}
          />
        </translate>
      </union>
      {cutoutDiameter !== undefined && (
        <translate
          by={{ x: size.x / 2 - cutoutDiameter / 2, y: wall, z: size.z - cutoutDiameter / 2 - upperFiletRadius }}
        >
          <rotate by={{ x: Math.PI / 2 }}>
            <Cylinder size={{ xy: cutoutDiameter, z: wall }} />
          </rotate>
        </translate>
      )}
    </subtract>
  )
}
