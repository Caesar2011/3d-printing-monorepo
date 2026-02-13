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
 * `children` are the resulting sections between dividers (length = at.length + 1).
 * Each child can optionally be further subdivided (axis flips automatically).
 */
export type Division = {
  at: number[]
  children?: (Division | null)[]
}

export type ContainerProps = {
  size: AxisRecordDefinition
  lap?: Lap
  radius?: number
  edges?: Edge
  divisions?: Division
  cutout?: {
    bottom?: CutoutSettings
    side?: CutoutSettings
    front?: CutoutSettings
    left?: CutoutSettings
    back?: CutoutSettings
    right?: CutoutSettings
  }
}
