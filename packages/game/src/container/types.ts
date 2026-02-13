import type { AxisRecordDefinition } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

export enum Lap {
  NONE,
  INNER_HALF,
  OUTER_HALF,
}

export enum CutoutType {
  EMPTY,
  HEX,
}

export type SideFaceName = 'front' | 'left' | 'back' | 'right'
export type FaceName = 'bottom' | SideFaceName

export type CutoutSettings = {
  type?: CutoutType
  border?: number
  borderRadius?: number
  hexInnerDiameter?: number
  hexWidth?: number
  center?: boolean
}

export type ContainerOpts = {
  radius: number
  edges: Edge
  gripWidth: number
  cutout: CutoutSettings
}

/**
 * Recursive subdivision tree.
 * Splits alternate between X and Y axes automatically.
 * `at` contains fractional positions (0–1 exclusive) where dividers are placed.
 * `children` maps to the sections between dividers (length must equal `at.length + 1`).
 * Each child can optionally be further subdivided (axis flips automatically).
 */
export type Division = {
  at: number[]
  children?: (Division | null)[]
}

export type CutoutConfig = {
  bottom?: CutoutSettings
  side?: CutoutSettings
} & Partial<Record<SideFaceName, CutoutSettings>>

export type ContainerProps = {
  size: AxisRecordDefinition
  lap?: Lap
  radius?: number
  edges?: Edge
  divisions?: Division
  cutout?: CutoutConfig
}
