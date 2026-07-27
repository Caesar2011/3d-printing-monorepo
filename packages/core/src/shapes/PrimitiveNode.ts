import { logger } from '../logger.js'

import type { Shape } from './Shape.js'

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
