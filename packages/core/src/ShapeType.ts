import type { Key, ReactNode } from 'react'

import type { ShapeProperties } from './Shape.js'
import { Shape } from './Shape.js'
import { logger } from './logger.js'

const MAX_CACHE_SIZE = 10_000

export abstract class PrimitiveNode<T extends object = object> {
  public readonly props: T
  private static cache = new Map<string, Shape[]>()
  constructor(props: unknown) {
    if (!this.arePropsValid(props)) {
      throw new Error('Props cannot be matched')
    }
    this.props = props
  }

  protected _id: string | undefined
  public get id() {
    if (this._id === undefined) {
      this._id = PrimitiveNode.hash(JSON.stringify(this.props))
    }
    return this._id
  }

  public render(): Shape[] {
    let cached = PrimitiveNode.cache.get(this.id)
    if (!cached) {
      if (PrimitiveNode.cache.size >= MAX_CACHE_SIZE) {
        const firstKey = PrimitiveNode.cache.keys().next().value
        if (firstKey !== undefined) PrimitiveNode.cache.delete(firstKey)
      }
      cached = this.renderFn(this.renderChildren())
      PrimitiveNode.cache.set(this.id, cached)
    }
    return cached
  }

  /** Clears the global render cache. Useful for tests or forced re-renders. */
  public static clearCache(): void {
    PrimitiveNode.cache.clear()
  }

  public abstract renderFn(children: Shape[] | undefined): Shape[]
  public renderChildren(): Shape[] | undefined {
    return undefined
  }

  public clone(props: unknown, keepChildren: boolean): PrimitiveNode<T> {
    return new (this.getClass())(props)
  }

  public abstract getClass(): new (props: unknown) => PrimitiveNode<T>

  protected arePropsValid(props: unknown): props is T {
    return typeof props === 'object'
  }

  protected static hash(str: string): string {
    let hash = 0x811c9dc5
    for (let i = 0, len = str.length; i < len; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
  }

  public renderTree(prefix: string = '', isLastChild = true): void {
    if (logger.isDebugEnabled?.() ?? true) {
      logger.debug(
        `${prefix}${isLastChild ? '└' : '├'}── ${this.getClass().name}${this._id !== undefined ? `(${this._id})` : ''} ${JSON.stringify(this.props)}`,
      )
    }
  }
}

export abstract class OperatorNode<T extends object = object> extends PrimitiveNode<T> {
  public readonly children: PrimitiveNode[] = []

  public renderChildren(): Shape[] {
    return this.children.map((child) => child.render()).flat()
  }

  public get id() {
    if (this._id === undefined) {
      this._id = PrimitiveNode.hash(
        JSON.stringify(this.props) + '|' + JSON.stringify(this.children.map((child) => child.id)),
      )
    }
    return this._id
  }

  public clone(props: unknown, keepChildren: boolean): OperatorNode<T> {
    const instance = new (this.getClass())(props)
    if (keepChildren) {
      instance.children.push(...this.children)
    }
    return instance
  }
  public abstract getClass(): new (props: unknown) => OperatorNode<T>
  public abstract renderFn(children: Shape[]): Shape[]

  public renderTree(prefix: string = '', isLastChild = true): void {
    super.renderTree(prefix, isLastChild)

    const lastIndex = this.children.length - 1
    this.children.forEach((child, index) => {
      const isLast = index === lastIndex
      const newPrefix = prefix + (isLastChild ? '    ' : '│   ')

      child.renderTree(newPrefix, isLast)
    })
  }
}

type CuboidProps = Parameters<typeof Shape.cuboid>[0]
export class CuboidNode extends PrimitiveNode<CuboidProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<CuboidProps> {
    return CuboidNode
  }
  public renderFn(): Shape[] {
    return [Shape.cuboid(this.props)]
  }
}

type SphereProps = Parameters<typeof Shape.sphere>[0]
export class SphereNode extends PrimitiveNode<SphereProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<SphereProps> {
    return SphereNode
  }
  public renderFn(): Shape[] {
    return [Shape.sphere(this.props)]
  }
}

type CylinderProps = Parameters<typeof Shape.cylinder>[0]
export class CylinderNode extends PrimitiveNode<CylinderProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<CylinderProps> {
    return CylinderNode
  }
  public renderFn(): Shape[] {
    return [Shape.cylinder(this.props)]
  }
}
export class UnionNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return UnionNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.union(children, this.props)]
  }
}

export class SubtractNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return SubtractNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.subtract(children, this.props)]
  }
}

export class IntersectNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return IntersectNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.intersect(children, this.props)]
  }
}

type TranslateProps = Parameters<InstanceType<typeof Shape>['translate']>[0]
export class TranslateNode extends OperatorNode<TranslateProps> {
  public getClass(): new (props: unknown) => OperatorNode<TranslateProps> {
    return TranslateNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.translate(this.props))
  }
}

type MirrorProps = Parameters<InstanceType<typeof Shape>['mirror']>[0]
export class MirrorNode extends OperatorNode<MirrorProps> {
  public getClass(): new (props: unknown) => OperatorNode<MirrorProps> {
    return MirrorNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.mirror(this.props))
  }
}

type CenterProps = Parameters<InstanceType<typeof Shape>['center']>[0]
export class CenterNode extends OperatorNode<CenterProps> {
  public getClass(): new (props: unknown) => OperatorNode<CenterProps> {
    return CenterNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.center(this.props))
  }
}

type RotateProps = Parameters<InstanceType<typeof Shape>['rotate']>[0]
export class RotateNode extends OperatorNode<RotateProps> {
  public getClass(): new (props: unknown) => OperatorNode<RotateProps> {
    return RotateNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.rotate(this.props))
  }
}

type ScaleProps = Parameters<InstanceType<typeof Shape>['scale']>[0]
export class ScaleNode extends OperatorNode<ScaleProps> {
  public getClass(): new (props: unknown) => OperatorNode<ScaleProps> {
    return ScaleNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.scale(this.props))
  }
}

type TransformProps = Parameters<InstanceType<typeof Shape>['transform']>[0]
export class TransformNode extends OperatorNode<TransformProps> {
  public getClass(): new (props: unknown) => OperatorNode<TransformProps> {
    return TransformNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.transform(this.props))
  }
}

type EntityProps = Parameters<InstanceType<typeof Shape>['set']>[0]
export class EntityNode extends OperatorNode<EntityProps> {
  public getClass(): new (props: unknown) => OperatorNode<EntityProps> {
    return EntityNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.set(this.props))
  }
}

export class RootNode extends OperatorNode {
  constructor() {
    super({})
  }
  public getClass(): { new (props: unknown): OperatorNode } {
    return RootNode
  }

  public renderFn(children: Shape[]): Shape[] {
    return children
  }
}

export const ShapeMap = {
  cuboid: CuboidNode,
  sphere: SphereNode,
  cylinder: CylinderNode,
} as const

export const ShapeMapBooleans = {
  union: UnionNode,
  subtract: SubtractNode,
  intersect: IntersectNode,
} as const

export const ShapeMapTransforms = {
  translate: TranslateNode,
  mirror: MirrorNode,
  scale: ScaleNode,
  rotate: RotateNode,
  center: CenterNode,
  transform: TransformNode,
  entity: EntityNode,
} as const

type TShapeMap = typeof ShapeMap
type TShapeMapBooleans = typeof ShapeMapBooleans
type TShapeMapTransforms = typeof ShapeMapTransforms
export type TProps = {
  [k in keyof TShapeMap]: InstanceType<TShapeMap[k]>['props'] & {
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

type ShapeKey = keyof TShapeMap | keyof TShapeMapBooleans | keyof TShapeMapTransforms

const ALL_SHAPE_CONSTRUCTORS: Record<string, (new (props: unknown) => PrimitiveNode) | undefined> = {
  ...ShapeMap,
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
