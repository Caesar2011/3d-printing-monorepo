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

type Cutout<Size extends number = number, Border extends number = number> = {
  type?: CutoutGridType
  border?: Border
  size?: Size
  strokeWidth?: number
  offset?: AxisRecordDefinition
  center?: boolean
}

export type ContainerOpts<CutoutSize extends number = number, CutoutBorder extends number = number> = {
  radius: number
  cutout: Cutout<CutoutSize, CutoutBorder>
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
    bottom?: Cutout<CutoutSize, CutoutBorder>
    side?: Cutout<CutoutSize, CutoutBorder>
  }
  edges?: Edge
}
