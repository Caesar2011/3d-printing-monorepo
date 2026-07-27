import type { Key, ReactNode } from 'react'

import { ShapeMapBooleans } from './booleans.js'
import type { PrimitiveNode } from './PrimitiveNode.js'
import { ShapeMapPrimitives } from './primitives.js'
import { ShapeMapTransforms } from './transforms.js'

type TShapeMapPrimitives = typeof ShapeMapPrimitives
type TShapeMapBooleans = typeof ShapeMapBooleans
type TShapeMapTransforms = typeof ShapeMapTransforms
export type TProps = {
  [k in keyof TShapeMapPrimitives]: InstanceType<TShapeMapPrimitives[k]>['props'] & {
    key?: Key | null | undefined
  }
} & {
  [k in keyof TShapeMapBooleans]: InstanceType<TShapeMapBooleans[k]>['props'] & {
    children: ReactNode
    key?: Key | null | undefined
  }
} & {
  [k in keyof TShapeMapTransforms]: InstanceType<TShapeMapTransforms[k]>['props'] & {
    children: ReactNode
    key?: Key | null | undefined
  }
}

const ALL_SHAPE_CONSTRUCTORS: Record<string, (new (props: unknown) => PrimitiveNode) | undefined> = {
  ...ShapeMapPrimitives,
  ...ShapeMapBooleans,
  ...ShapeMapTransforms,
}

export function createShape(type: string, props: unknown): PrimitiveNode {
  const cls = ALL_SHAPE_CONSTRUCTORS[type]
  if (cls) {
    return new cls(props)
  }
  throw new Error(`Unknown intrinsic element "${type}"`)
}
