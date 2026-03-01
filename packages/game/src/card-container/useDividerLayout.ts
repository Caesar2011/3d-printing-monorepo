import type { Vector3 } from '@jsxcad/core'

export interface DividerLayoutParams {
  containerSize: Vector3
  wall: number
  lidRadius: number
  slotDepth: number
  minSpacing: number
  filletRadius: number
}

export interface DividerLayoutResult {
  /** Number of divider slots along the Y axis */
  slotCount: number
  /** Even spacing between dividers */
  spacing: number
  /** Y offset where usable divider region begins */
  regionStartY: number
  /** Y offset where usable divider region ends */
  regionEndY: number
}

export function computeDividerLayout(params: DividerLayoutParams): DividerLayoutResult {
  const { containerSize, wall, lidRadius, slotDepth, minSpacing } = params

  // The divider region starts after the wall/radius and ends symmetrically before the far wall
  const regionStartY = Math.max(wall, lidRadius)
  const regionEndY = containerSize.y - regionStartY

  const availableLength = regionEndY - regionStartY
  const slotCount = Math.floor((availableLength + slotDepth) / (slotDepth + minSpacing))
  const spacing = (availableLength - slotDepth * (slotCount - 1)) / slotCount

  return { slotCount, spacing, regionStartY, regionEndY }
}
