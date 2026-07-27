import { OperatorNode } from './OperatorNode.js'
import type { ShapeProperties } from './Shape.js'
import { Shape } from './Shape.js'

class UnionNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return UnionNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.union(children, this.props)]
  }
}

class SubtractNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return SubtractNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.subtract(children, this.props)]
  }
}

class IntersectNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return IntersectNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.intersect(children, this.props)]
  }
}

class HullNode extends OperatorNode<ShapeProperties> {
  public getClass(): new (props: unknown) => OperatorNode<ShapeProperties> {
    return HullNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return [Shape.hull(children, this.props)]
  }
}

export const ShapeMapBooleans = {
  union: UnionNode,
  subtract: SubtractNode,
  intersect: IntersectNode,
  hull: HullNode,
} as const
