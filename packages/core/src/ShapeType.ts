import { Shape } from './Shape.js'

export abstract class PrimitiveType<T extends object = object> {
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
      this._id = PrimitiveType.hash(JSON.stringify(this.props))
    }
    return this._id
  }

  public render(): Shape[] {
    let cached = PrimitiveType.cache.get(this.id)
    if (!cached) {
      cached = this.renderFn(this.renderChildren())
      PrimitiveType.cache.set(this.id, cached)
    }
    return cached
  }

  public abstract renderFn(children: Shape[] | undefined): Shape[]
  public renderChildren(): Shape[] | undefined {
    return undefined
  }

  public clone(props: unknown, keepChildren: boolean): PrimitiveType<T> {
    return new (this.getClass())(props)
  }

  public abstract getClass(): new (props: unknown) => PrimitiveType<T>

  protected arePropsValid(props: unknown): props is T {
    return typeof props === 'object'
  }

  protected static hash(str: string): string {
    let hash = 0x811c9dc5 // FNV offset basis
    for (let i = 0, len = str.length; i < len; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) // FNV prime
    }
    // Convert to an unsigned 32-bit integer and then to hex
    return (hash >>> 0).toString(16)
  }
}

export abstract class OperatorType<T extends object = object> extends PrimitiveType<T> {
  public readonly children: PrimitiveType[] = []

  public renderChildren(): Shape[] {
    return this.children.map((child) => child.render()).flat()
  }

  public get id() {
    if (this._id === undefined) {
      this._id = PrimitiveType.hash(
        JSON.stringify(this.props) + '|' + JSON.stringify(this.children.map((child) => child.id)),
      )
    }
    return this._id
  }

  public clone(props: unknown, keepChildren: boolean): OperatorType<T> {
    const instance = new (this.getClass())(props)
    if (keepChildren) {
      instance.children.push(...this.children)
    }
    return instance
  }
  public abstract getClass(): new (props: unknown) => OperatorType<T>
  public abstract renderFn(children: Shape[]): Shape[]
}

type CuboidProps = Parameters<typeof Shape.cuboid>[0]
export class CuboidNode extends PrimitiveType<CuboidProps> {
  public getClass(): new (props: unknown) => PrimitiveType<CuboidProps> {
    return CuboidNode
  }
  public renderFn(): Shape[] {
    return Shape.cuboid(this.props)
  }
}

export class UnionNode extends OperatorType {
  public getClass(): new (props: unknown) => OperatorType {
    return UnionNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.union(children)]
  }
}

export class SubtractNode extends OperatorType {
  public getClass(): new (props: unknown) => OperatorType {
    return SubtractNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.subtract(children)]
  }
}

export class IntersectNode extends OperatorType {
  public getClass(): new (props: unknown) => OperatorType {
    return IntersectNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.intersect(children)]
  }
}

export class RootNode extends OperatorType {
  constructor() {
    super({})
  }
  public getClass(): { new (props: unknown): OperatorType } {
    return RootNode
  }

  public renderFn(children: Shape[]): Shape[] {
    return children
  }
}

// ============================================================================
// Type Definitions
// ============================================================================
export type Instance = PrimitiveType
export type Container = RootNode
// ============================================================================
// Intrinsic Element Handling
// ============================================================================
export function createShape(type: string, props: unknown): Instance {
  switch (type) {
    case 'cuboid':
      return new CuboidNode(props)
    case 'union':
      return new UnionNode(props)
    case 'subtract':
      return new SubtractNode(props)
    case 'intersect':
      return new IntersectNode(props)
    default:
      throw new Error(`Unknown intrinsic element ${type}`)
  }
}
