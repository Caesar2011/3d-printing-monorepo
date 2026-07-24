import type { Vector3 } from '@jsxcad/core'

export interface DividerLayoutParams {
  containerSize: Vector3
  wall: number
  lidRadius: number
  slotDepth: number
  minSpacing: number
  filletRadius: number
  /** Per-region Y spacing overrides, keyed by region index (0-based). */
  regionSpacing?: Record<number, number>
}

export interface DividerLayoutResult {
  /** Number of regions along the Y axis */
  slotCount: number
  /** Default even spacing for non-overridden regions */
  spacing: number
  /** Y offset where usable divider region begins */
  regionStartY: number
  /** Y offset where usable divider region ends */
  regionEndY: number
  /** Resolved per-region spacings (length === slotCount) */
  regionSpacings: number[]
}

export function computeDividerLayout(params: DividerLayoutParams): DividerLayoutResult {
  const { containerSize, wall, lidRadius, slotDepth, minSpacing, regionSpacing = {} } = params

  // The divider region spans the inner Y cavity minus the lid radius insets
  const regionStartY = wall + lidRadius / 2
  const regionEndY = containerSize.y - wall - lidRadius / 2
  const totalRegion = regionEndY - regionStartY

  // Determine slot count from uniform spacing first
  const maxSlots = Math.floor((totalRegion + slotDepth) / (minSpacing + slotDepth))
  const slotCount = Math.max(1, maxSlots)
  const totalSlotDepth = (slotCount - 1) * slotDepth

  // Sum fixed overrides and count how many regions use the default spacing
  const fixedOverrides = Object.entries(regionSpacing)
  let fixedTotal = 0
  let fixedCount = 0
  for (const [key, value] of fixedOverrides) {
    const idx = Number(key)
    if (idx >= 0 && idx < slotCount) {
      fixedTotal += value
      fixedCount++
    }
  }

  const flexCount = slotCount - fixedCount
  const remainingSpace = totalRegion - totalSlotDepth - fixedTotal
  const spacing = flexCount > 0 ? remainingSpace / flexCount : 0

  // Build the resolved per-region spacings array
  const regionSpacings: number[] = []
  for (let i = 0; i < slotCount; i++) {
    regionSpacings.push(regionSpacing[i] ?? spacing)
  }

  return { slotCount, spacing, regionStartY, regionEndY, regionSpacings }
}
