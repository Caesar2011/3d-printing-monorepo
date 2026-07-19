import type { AxisRecordDefinition } from '@jsxcad/core'

export type DividerConfig = {
  dividerDepth?: number
  dividerSpacingMin?: number
  dividerArmHeight?: number
  dividerRadius?: number
  dividers?: number | number[] | 'all'
  contentSizes?: (AxisRecordDefinition | undefined)[]
  /** Per-region Y spacing overrides, keyed by region index (0-based). */
  regionSpacing?: Record<number, number>
}

export type DividerLayout = {
  /** Number of divider slots (slot count, not divider count) */
  slotCount: number
  /** Spacing between dividers along the Y axis */
  spacing: number
  /** Y coordinate where the first divider slot begins */
  firstSlotY: number
  /** Depth (Y thickness) of each divider slot */
  slotDepth: number
}
