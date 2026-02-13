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

export type ContainerProps = {
  size: AxisRecordDefinition
  lap?: Lap
  radius?: number
  edges?: Edge
  cutout?: {
    bottom?: CutoutSettings
    side?: CutoutSettings
    front?: CutoutSettings
    left?: CutoutSettings
    back?: CutoutSettings
    right?: CutoutSettings
  }
}
