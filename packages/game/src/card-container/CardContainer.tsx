import type { FC } from 'react'
import { Colors, ShapeType, V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'

import type { ContainerProps } from '../container/types.js'
import { Container, resolveContainerConfig } from '../container/Container.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { useContainerContext } from '../container/ContainerContext.js'
import { Edge } from '../primitives/index.js'

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

/** Computes Y-regions bounded by placed dividers (and container edges). */
function computeContentRegions(
  dividerIndices: number[],
  slotYPositions: number[],
  slotDepth: number,
  regionStartY: number,
  regionEndY: number,
): { startY: number; endY: number }[] {
  const sortedSlots = [...dividerIndices].sort((a, b) => a - b)
  const boundaries: { startY: number; endY: number }[] = []

  let cursor = regionStartY
  for (const slotIdx of sortedSlots) {
    if (slotIdx >= slotYPositions.length) break
    const slotStart = slotYPositions[slotIdx]
    boundaries.push({ startY: cursor, endY: slotStart })
    cursor = slotStart + slotDepth
  }
  boundaries.push({ startY: cursor, endY: regionEndY })

  return boundaries
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
    regionSpacing: options.regionSpacing,
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
  const contentSizes = options.contentSizes ?? []

  // Precompute cumulative Y positions for each region and slot
  const regionYPositions: number[] = []
  const slotYPositions: number[] = []
  let cursor = layout.regionStartY
  for (let i = 0; i < layout.slotCount; i++) {
    regionYPositions.push(cursor)
    cursor += layout.regionSpacings[i]
    if (i < layout.slotCount - 1) {
      slotYPositions.push(cursor)
      cursor += slotDepth
    }
  }

  // Content regions are bounded by placed dividers and container edges
  const contentRegions = computeContentRegions(
    dividerIndices,
    slotYPositions,
    slotDepth,
    layout.regionStartY,
    layout.regionEndY,
  )

  if (contentSizes.length > contentRegions.length) {
    throw new Error(
      `contentSizes has ${contentSizes.length} entries but only ${contentRegions.length} content regions are available.`,
    )
  }

  const innerWidth = containerSize.x - 2 * wall

  return (
    <>
      <subtract type={ShapeType.Part}>
        <Container size={size} {...options} />

        {fingerCutoutDiameter !== undefined && (
          <CardContainerCutout
            containerSize={containerSize}
            fingerCutoutDiameter={fingerCutoutDiameter}
            armWidth={armWidth}
            filletRadius={filletRadius}
          />
        )}

        {range(layout.slotCount - 1).map((i) => (
          <translate
            key={i}
            by={{
              y: slotYPositions[i],
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

      {range(layout.slotCount - 1)
        .filter((i) => dividerIndices.includes(i))
        .map((i) => (
          <entity type={ShapeType.Part} color={Colors.BROWN_5} key={i} name={`divider_${i}`}>
            <translate
              by={{
                y: slotYPositions[i] + slideTolerance,
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

      {contentSizes.map((contentSizeDef, i) => {
        if (contentSizeDef === undefined) return undefined
        const contentSize = V(contentSizeDef)
        const region = contentRegions[i]
        const regionDepth = region.endY - region.startY
        const contentX = wall + (innerWidth - contentSize.x) / 2
        const contentY =
          i === 0
            ? region.endY - contentSize.y - 0.1
            : i === contentSizes.length - 1
              ? region.startY + 0.1
              : region.startY + (regionDepth - contentSize.y) / 2

        return (
          <entity type={ShapeType.Content} key={`Content_${i}`} name={`Content_${i}`}>
            <translate by={{ x: contentX, y: contentY, z: floor }}>
              <cuboid size={contentSize} />
            </translate>
          </entity>
        )
      })}
    </>
  )
}
