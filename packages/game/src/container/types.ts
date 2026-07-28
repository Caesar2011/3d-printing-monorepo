import type { AxisRecordDefinition } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

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

export type ContainerContextOpts = {
  radius: number
  edges: Edge
  gripWidth: number
  cutout: CutoutSettings
  cutoutEdges: Edge
  scoopFactor: number
  maxEmbossSize: AxisRecordDefinition
}

/**
 * Recursive subdivision tree.
 * Splits alternate between X and Y axes automatically.
 * `at` contains fractional positions (0–1 exclusive) where dividers are placed.
 * `children` maps to the sections between dividers (length must equal `at.length + 1`).
 * Each child can optionally be further subdivided (axis flips automatically).
 */
export type Division = {
  at?: number[]
  children?: (Division | null)[]
  embossSrc?: string
  /** Overrides the container scoop setting for this division and its children. */
  scoop?: boolean
}

export type CutoutConfig = {
  bottom?: CutoutSettings
  side?: CutoutSettings
} & Partial<Record<SideFaceName, CutoutSettings>>

export type ContainerProps = {
  wall?: number
  size: AxisRecordDefinition
  radius?: number
  edges?: Edge
  divisions?: Division
  cutout?: CutoutConfig
  scoop?: boolean
  cutoutEdges?: Edge
  maxEmbossSize?: AxisRecordDefinition
}
