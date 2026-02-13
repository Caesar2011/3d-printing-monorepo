import { V, type Vector3 } from '@jsxcad/core'

import type { Division } from './types.js'

/** A leaf cell: its position and size within the container's inner volume. */
export type CavityCell = {
  /** Offset relative to the inner volume origin */
  offset: Vector3
  /** Size of this cell's cavity */
  size: Vector3
}

/**
 * Flattens a recursive Division tree into leaf CavityCell entries.
 *
 * The first split is always along X. Each level alternates: X → Y → X → Y …
 * `innerOrigin` is the origin of the available inner rectangle.
 * `innerSize` is the available inner rectangle size.
 * `wall` is the divider thickness (same as container wall).
 * `axis` alternates between 'x' and 'y'.
 */
export function computeCavityCells(
  innerOrigin: Vector3,
  innerSize: Vector3,
  wall: number,
  division?: Division | null,
  axis: 'x' | 'y' = 'x',
): CavityCell[] {
  if (!division || division.at.length === 0) {
    return [{ offset: innerOrigin, size: innerSize }]
  }

  const sorted = [...division.at].sort((a, b) => a - b)
  const sectionCount = sorted.length + 1
  const children = division.children ?? []
  const nextAxis = axis === 'x' ? 'y' : 'x'

  const totalAlongAxis = axis === 'x' ? innerSize.x : innerSize.y
  const dividerCount = sorted.length
  const totalDividerThickness = dividerCount * wall
  const availableSpace = totalAlongAxis - totalDividerThickness

  // Compute fractional boundaries including 0 and 1
  const boundaries = [0, ...sorted, 1]

  const cells: CavityCell[] = []

  for (let i = 0; i < sectionCount; i++) {
    const fracStart = boundaries[i]
    const fracEnd = boundaries[i + 1]
    const sectionSize = (fracEnd - fracStart) * availableSpace

    if (sectionSize <= 0) continue

    // Position along the split axis:
    // sum of previous sections + previous dividers
    const posAlongAxis = fracStart * availableSpace + i * wall

    const sectionOrigin =
      axis === 'x'
        ? V([innerOrigin.x + posAlongAxis, innerOrigin.y, innerOrigin.z])
        : V([innerOrigin.x, innerOrigin.y + posAlongAxis, innerOrigin.z])

    const sectionDim =
      axis === 'x'
        ? V([sectionSize, innerSize.y, innerSize.z])
        : V([innerSize.x, sectionSize, innerSize.z])

    const childDivision = children[i] ?? null
    cells.push(...computeCavityCells(sectionOrigin, sectionDim, wall, childDivision, nextAxis))
  }

  return cells
}