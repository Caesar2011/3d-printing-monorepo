import { OperatorNode } from './OperatorNode.js'
import type { Shape } from './Shape.js'

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
