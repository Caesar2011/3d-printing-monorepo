import type { FC } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'

import type { ContainerProps } from '../container/types.js'
import { Container, resolveContainerConfig } from '../container/Container.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { useContainerContext } from '../container/ContainerContext.js'
import { Cuboid, Cylinder, Edge, Fillet } from '../primitives/index.js'
import { Colors } from '../utils/index.js'
import { logger } from '../logger.js'

import type { DividerProps } from './types.js'
import { DividerCutout } from './DividerCutout.js'
import { Divider } from './Divider.js'

export const CardContainer: FC<ContainerProps & DividerProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()

  if (options.scoop === true) {
    throw new Error(`Scoop feature is not supported for this container type.`)
  }

  if (options.divisions !== undefined) {
    throw new Error(`Divisions feature is not supported for this container type.`)
  }

  // TODO test with cutout sides

  const { containerRadius, containerEdges, wall, floor } = resolveContainerConfig(options, containerCtx, shapeCtx)
  const containerDimensions = V(size)

  const isRounded = (Edge.BACK & Edge.SIDE & containerEdges) !== 0
  const radiusForLid = isRounded ? containerRadius : 0

  const slideTolerance = shapeCtx.tolerance.sliding
  const dividerDepth = (options.dividerDepth ?? wall / 2) + slideTolerance * 2
  const dividerArmHeight = options.dividerArmHeight ?? containerDimensions.z / 5
  const dividerRadius = options.dividerRadius ?? radiusForLid - wall / 2
  const dividerSpacingMin = options.dividerSpacingMin ?? dividerRadius * 2 + dividerDepth * 4

  if (dividerSpacingMin < dividerRadius * 2) {
    throw new Error(
      `Divider spacing must be at least ${dividerRadius * 2}mm (at least twice the radius of the divider).`,
    )
  }

  const startMax = Math.max(wall, radiusForLid)
  const endMax = containerDimensions.y - startMax
  const divisions = Math.floor((endMax - startMax + dividerDepth) / (dividerDepth + dividerSpacingMin))
  const dividerSpacing = (endMax - startMax - dividerDepth * (divisions - 1)) / divisions

  const dividerSize = V({
    x: containerDimensions,
    y: dividerDepth - slideTolerance * 2,
    z: containerDimensions.z - floor,
  })
  const upperWidth = Math.max(dividerRadius * 2, wall * 2, dividerSize.x / 2 - dividerSize.z / 2)
  const cutoutDiameter = dividerSize.x - upperWidth * 2

  const dividers =
    options.dividers === 'all'
      ? range(divisions)
      : typeof options.dividers === 'number'
        ? range(options.dividers)
        : options.dividers === undefined
          ? []
          : options.dividers

  logger.info(`Dividers: ${dividers.join(', ')}`)

  return (
    <>
      <subtract>
        <Container size={size} {...options} />
        {cutoutDiameter !== undefined && (
          <>
            <translate
              by={{
                x: containerDimensions.x / 2 - cutoutDiameter / 2,
                y: containerDimensions.y,
                z: containerDimensions.z - cutoutDiameter / 2 - dividerRadius,
              }}
            >
              <rotate by={{ x: Math.PI / 2 }}>
                <Cylinder size={{ xy: cutoutDiameter, z: containerDimensions.y }} />
              </rotate>
            </translate>

            <translate by={{ x: upperWidth, z: containerDimensions.z }}>
              <rotate by={{ y: Math.PI / 2, z: Math.PI / 2 }}>
                <Fillet size={{ xy: dividerRadius, z: containerDimensions.y }} />
              </rotate>
            </translate>
            <translate
              by={{ x: containerDimensions.x - upperWidth, y: containerDimensions.y, z: containerDimensions.z }}
            >
              <rotate by={{ y: Math.PI / 2, z: -Math.PI / 2 }}>
                <Fillet size={{ xy: dividerRadius, z: containerDimensions.y }} />
              </rotate>
            </translate>
            <translate by={{ x: upperWidth, z: containerDimensions.z - dividerRadius }}>
              <Cuboid
                size={{ x: containerDimensions.x - 2 * upperWidth, y: containerDimensions.y, z: dividerRadius }}
              />
            </translate>
          </>
        )}
        {range(divisions - 1).map((i) => (
          <translate
            by={{
              y: startMax + dividerSpacing + (dividerSpacing + dividerDepth) * i,
              z: containerDimensions.z - dividerArmHeight,
            }}
          >
            <DividerCutout
              dim={{
                x: containerDimensions,
                y: dividerDepth,
                z: dividerArmHeight,
              }}
              upperFiletRadius={dividerRadius}
            />
          </translate>
        ))}
      </subtract>
      {range(divisions - 1)
        .filter((i) => dividers.includes(i))
        .map((i) => (
          <entity type={ShapeType.Part} color={Colors.BROWN_5} key={i} name={`divider-${i}`}>
            <translate
              by={{ y: startMax + dividerSpacing + slideTolerance + (dividerSpacing + dividerDepth) * i, z: floor }}
            >
              <Divider
                dim={dividerSize}
                upperFiletRadius={dividerRadius}
                wall={wall + slideTolerance}
                upperHeight={dividerArmHeight}
                cutoutDiameter={cutoutDiameter}
              />
            </translate>
          </entity>
        ))}
    </>
  )
}
