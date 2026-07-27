import { PrimitiveNode } from './PrimitiveNode.js'
import type { Shape } from './Shape.js'

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
