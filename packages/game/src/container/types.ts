import type { AxisRecordDefinition } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

export enum Lap {
  NONE,
  INNER_HALF,
  OUTER_HALF,
}

export enum CutoutGridType {
  EMPTY,
  HEX,
}

export type Cutout<Radius extends number = number, Size extends number = number, Border extends number = number> = {
  type?: CutoutGridType
  border?: Border
  borderRadius?: Radius | null
  gridSize?: Size
  strokeWidth?: number
  offset?: AxisRecordDefinition
  center?: boolean
}

export type ContainerOpts<
  Radius extends number = number,
  CutoutSize extends number = number,
  CutoutBorder extends number = number,
> = {
  radius: number
  cutout: Cutout<Radius, CutoutSize, CutoutBorder>
  edges: Edge
  gripWidth: number
}

export type ContainerProps<
  Radius extends number = number,
  CutoutSize extends number = number,
  CutoutBorder extends number = number,
> = {
  size: AxisRecordDefinition
  lap?: Lap
  radius?: Radius
  cutout?: {
    bottom?: Cutout<Radius, CutoutSize, CutoutBorder>
    side?: Cutout<Radius, CutoutSize, CutoutBorder>
    front?: Cutout<Radius, CutoutSize, CutoutBorder>
    left?: Cutout<Radius, CutoutSize, CutoutBorder>
    back?: Cutout<Radius, CutoutSize, CutoutBorder>
    right?: Cutout<Radius, CutoutSize, CutoutBorder>
  }
  edges?: Edge
}
