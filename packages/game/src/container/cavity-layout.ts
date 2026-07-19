import { V, type Vector3 } from '@jsxcad/core'

import type { Division } from './types.js'

/** A leaf cell: its position and size within the container's inner volume. */
export type CavityCell = {
  offset: Vector3
  size: Vector3
  embossSrc?: string
}

/** Validates a Division node and throws on invalid input. */
function validateDivision(division: Division): void {
  const { at, children } = division

  if (at === undefined) return

  for (const value of at) {
    if (value <= 0 || value >= 1) {
      throw new RangeError(`Division position ${value} must be in (0, 1) exclusive`)
    }
  }

  const sorted = [...at].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i] - sorted[i - 1]) < 1e-9) {
      throw new RangeError(`Duplicate division position: ${sorted[i]}`)
    }
  }

  if (children && children.length !== at.length + 1) {
    throw new RangeError(`Division children length (${children.length}) must equal at.length + 1 (${at.length + 1})`)
  }
}

/**
 * Flattens a recursive Division tree into leaf CavityCell entries.
 * The first split is along X, then alternates: X → Y → X → Y …
 */
export function computeCavityCells(
  innerOrigin: Vector3,
  innerSize: Vector3,
  wall: number,
  division?: Division,
  axis: 'x' | 'y' = 'x',
): CavityCell[] {
  if (!division || !division.at || division.at.length === 0) {
    if (division?.children?.length === 1 && division.children[0]) {
      const nextAxis = axis === 'x' ? 'y' : 'x'
      return computeCavityCells(innerOrigin, innerSize, wall, division.children[0], nextAxis)
    }
    return [{ offset: innerOrigin, size: innerSize, embossSrc: division?.embossSrc }]
  }

  validateDivision(division)

  const sorted = [...division.at].sort((a, b) => a - b)
  const sectionCount = sorted.length + 1
  const children = division.children ?? []
  const nextAxis = axis === 'x' ? 'y' : 'x'

  const totalAlongAxis = axis === 'x' ? innerSize.x : innerSize.y
  const totalDividerThickness = sorted.length * wall
  const availableSpace = totalAlongAxis - totalDividerThickness

  const boundaries = [0, ...sorted, 1]
  const cells: CavityCell[] = []

  for (let i = 0; i < sectionCount; i++) {
    const fracStart = boundaries[i]
    const fracEnd = boundaries[i + 1]
    const sectionSize = (fracEnd - fracStart) * availableSpace

    if (sectionSize <= 0) continue

    const posAlongAxis = fracStart * availableSpace + i * wall

    const sectionOrigin =
      axis === 'x'
        ? V([innerOrigin.x + posAlongAxis, innerOrigin.y, innerOrigin.z])
        : V([innerOrigin.x, innerOrigin.y + posAlongAxis, innerOrigin.z])

    const sectionDim =
      axis === 'x' ? V([sectionSize, innerSize.y, innerSize.z]) : V([innerSize.x, sectionSize, innerSize.z])

    const childDivision = children[i] ?? undefined
    cells.push(...computeCavityCells(sectionOrigin, sectionDim, wall, childDivision, nextAxis))
  }

  return cells
}
