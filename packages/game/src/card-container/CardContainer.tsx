import type { FC } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'

import type { ContainerProps } from '../container/types.js'
import { Container, resolveContainerConfig } from '../container/Container.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { useContainerContext } from '../container/ContainerContext.js'
import { Edge } from '../primitives/index.js'
import { Colors } from '../utils/index.js'
import { logger } from '../logger.js'

import type { DividerConfig } from './types.js'
import { computeDividerLayout } from './useDividerLayout.js'
import { CardContainerCutout } from './CardContainerCutout.js'
import { DividerSlotCutout } from './DividerSlotCutout.js'
import { Divider } from './Divider.js'

function resolveDividerIndices(dividers: DividerConfig['dividers'], slotCount: number): number[] {
  if (dividers === 'all') return range(slotCount)
  if (typeof dividers === 'number') return range(dividers)
  if (dividers === undefined) return []
  return dividers
}

export const CardContainer: FC<ContainerProps & DividerConfig> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()

  if (options.scoop === true) {
    throw new Error(`Scoop feature is not supported for this container type.`)
  }

  if (options.divisions !== undefined) {
    throw new Error(`Divisions feature is not supported for this container type.`)
  }

  const { containerRadius, containerEdges, wall, floor } = resolveContainerConfig(options, containerCtx, shapeCtx)
  const containerSize = V(size)

  const hasRoundedBackEdges = (Edge.BACK & Edge.SIDE & containerEdges) !== 0
  const lidRadius = hasRoundedBackEdges ? containerRadius : 0

  const slideTolerance = shapeCtx.tolerance.sliding
  const slotDepth = (options.dividerDepth ?? wall / 2) + slideTolerance * 2
  const armHeight = options.dividerArmHeight ?? containerSize.z / 5
  const filletRadius = options.dividerRadius ?? lidRadius - wall / 2
  const minSpacing = options.dividerSpacingMin ?? filletRadius * 2 + slotDepth * 4

  if (minSpacing < filletRadius * 2) {
    throw new Error(
      `Divider spacing must be at least ${filletRadius * 2}mm (at least twice the radius of the divider).`,
    )
  }

  const layout = computeDividerLayout({
    containerSize,
    wall,
    lidRadius,
    slotDepth,
    minSpacing,
    filletRadius,
  })

  const dividerThickness = slotDepth - slideTolerance * 2
  const dividerSize = V({
    x: containerSize,
    y: dividerThickness,
    z: containerSize.z - floor,
  })

  const armWidth = Math.max(filletRadius * 2, wall * 2, dividerSize.x / 2 - dividerSize.z / 2)
  const fingerCutoutDiameter = dividerSize.x - armWidth * 2

  const dividerIndices = resolveDividerIndices(options.dividers, layout.slotCount)

  logger.info(`Dividers: ${dividerIndices.join(', ')}`)

  /** Compute the Y position for a divider slot by index */
  const slotY = (index: number) => layout.regionStartY + layout.spacing + (layout.spacing + slotDepth) * index

  return (
    <>
      <subtract>
        <Container size={size} {...options} />

        {/* Finger-scoop cutout along the top of the container */}
        {fingerCutoutDiameter !== undefined && (
          <CardContainerCutout
            containerSize={containerSize}
            fingerCutoutDiameter={fingerCutoutDiameter}
            armWidth={armWidth}
            filletRadius={filletRadius}
          />
        )}

        {/* Divider slot cutouts in the container walls */}
        {range(layout.slotCount - 1).map((i) => (
          <translate
            key={i}
            by={{
              y: slotY(i),
              z: containerSize.z - armHeight,
            }}
          >
            <DividerSlotCutout
              size={{
                x: containerSize,
                y: slotDepth,
                z: armHeight,
              }}
              filletRadius={filletRadius}
            />
          </translate>
        ))}
      </subtract>

      {/* Divider parts */}
      {range(layout.slotCount - 1)
        .filter((i) => dividerIndices.includes(i))
        .map((i) => (
          <entity type={ShapeType.Part} color={Colors.BROWN_5} key={i} name={`divider-${i}`}>
            <translate
              by={{
                y: slotY(i) + slideTolerance,
                z: floor,
              }}
            >
              <Divider
                size={dividerSize}
                filletRadius={filletRadius}
                armInset={wall + slideTolerance}
                armHeight={armHeight}
                fingerCutoutDiameter={fingerCutoutDiameter}
              />
            </translate>
          </entity>
        ))}
    </>
  )
}
