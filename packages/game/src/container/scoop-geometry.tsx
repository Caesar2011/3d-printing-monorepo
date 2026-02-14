import type { FC } from 'react'
import { V, type Vector3 } from '@jsxcad/core'

import { Cuboid, Edge } from '../primitives/Cuboid.js'
import { RoundedCylinder } from '../primitives/index.js'

import type { CavityCell } from './cavity-layout.js'

export type ScoopAxis = 'x' | 'y'

/** Determines which axis gets the scoop: the longer side, defaulting to X when equal. */
export function determineScoopAxis(cell: CavityCell): ScoopAxis {
  return cell.size.x >= cell.size.y ? 'x' : 'y'
}

/** Computes the scoop width (horizontal radius of the quarter-ellipse). */
export function computeScoopWidth(cellHeight: number, factor: number): number {
  return cellHeight / factor
}

/** Validates that the cell has enough room along the long axis for two scoops. */
export function validateScoopFit(cell: CavityCell, scoopWidth: number): void {
  const axis = determineScoopAxis(cell)
  const longSide = axis === 'x' ? cell.size.x : cell.size.y

  if (2 * scoopWidth > longSide) {
    throw new RangeError(
      `Scoop width (${scoopWidth.toFixed(2)} × 2 = ${(2 * scoopWidth).toFixed(2)}) exceeds ` +
        `available ${axis}-axis length (${longSide.toFixed(2)}). ` +
        `Reduce container height or increase the ${axis} dimension.`,
    )
  }
}

/** Validates that imprint of cell is only on solid bottom. */
export function validateImprintBottom(cell: CavityCell, isSolidBottom: boolean): void {
  if (!isSolidBottom && cell.imprintSrc !== undefined) {
    throw new Error(`Imprint is only allowed on solid bottom.`)
  }
}

/** Checks whether the scoop cylinders need filleted edges based on the container edge bitmask. */
function needsScoopFillet(edges: Edge, axis: ScoopAxis): boolean {
  const relevantEdges = axis === 'x' ? Edge.LEFT | Edge.RIGHT | Edge.BOT : Edge.FRONT | Edge.BACK | Edge.BOT
  return (edges & relevantEdges) !== 0
}

/**
 * A quarter-ellipse cylinder lying on its side, used to carve the scoop shape.
 * The ellipse cross-section has:
 *   - vertical half-axis = cellHeight
 *   - horizontal half-axis = scoopWidth (cellHeight / factor)
 * Extruded along the short axis for `extrudeLength`.
 */
const QuarterEllipseCylinder: FC<{
  cellHeight: number
  scoopWidth: number
  extrudeLength: number
  radius: number
}> = ({ cellHeight, scoopWidth, extrudeLength, radius }) => (
  <intersect>
    <RoundedCylinder size={{ x: cellHeight * 2, y: scoopWidth * 2, z: extrudeLength }} radius={radius} />
    <cuboid size={{ x: cellHeight, y: scoopWidth, z: extrudeLength }} />
  </intersect>
)

/**
 * Renders the scoop cavity shape for a single cell.
 * Consists of a central cuboid plus two quarter-ellipse cylinders on the long-axis ends.
 */
export const ScoopedCavity: FC<{
  size: Vector3
  scoopWidth: number
  radius: number
  edges: Edge
}> = ({ size, scoopWidth, radius, edges }) => {
  const axis = size.x >= size.y ? 'x' : 'y'
  const cellHeight = size.z
  const longSide = axis === 'x' ? size.x : size.y
  const shortSide = axis === 'x' ? size.y : size.x

  const centralLength = longSide - 2 * scoopWidth

  const useFillet = needsScoopFillet(edges, axis) && radius > 0
  const filletRadius = useFillet ? radius : 0
  const centralEdges = useFillet ? Edge.BOT & (Edge.RIGHT | Edge.LEFT) : Edge.NONE

  const halfShort = shortSide / 2
  const halfLong = longSide / 2

  const quarterCylinderProps = {
    cellHeight,
    scoopWidth,
    extrudeLength: shortSide,
    radius: filletRadius,
  }

  return (
    <rotate by={axis === 'x' ? { z: Math.PI / 2 } : 0} center={{ xy: halfLong }}>
      <union>
        {centralLength > 0 && (
          <translate by={V([0, scoopWidth, 0])}>
            <Cuboid size={V([shortSide, centralLength, cellHeight])} edges={centralEdges} radius={filletRadius} />
          </translate>
        )}

        <rotate by={{ y: -Math.PI / 2 }} center={{ xz: halfShort }}>
          <QuarterEllipseCylinder {...quarterCylinderProps} />
        </rotate>

        <translate by={V([0, longSide, 0])}>
          <rotate by={{ y: -Math.PI / 2, z: Math.PI }} center={{ xz: halfShort }}>
            <QuarterEllipseCylinder {...quarterCylinderProps} />
          </rotate>
        </translate>
      </union>
    </rotate>
  )
}
