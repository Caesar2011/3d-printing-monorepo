import { OperatorNode } from './OperatorNode.js'
import type { Shape } from './Shape.js'
import { LayoutItemNode, LayoutNode } from './transforms-layout.js'

type TranslateProps = Parameters<InstanceType<typeof Shape>['translate']>[0]

class TranslateNode extends OperatorNode<TranslateProps> {
  public getClass(): new (props: unknown) => OperatorNode<TranslateProps> {
    return TranslateNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.translate(this.props))
  }
}

type MirrorProps = Parameters<InstanceType<typeof Shape>['mirror']>[0]

class MirrorNode extends OperatorNode<MirrorProps> {
  public getClass(): new (props: unknown) => OperatorNode<MirrorProps> {
    return MirrorNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.mirror(this.props))
  }
}

type CenterProps = Parameters<InstanceType<typeof Shape>['center']>[0]

class CenterNode extends OperatorNode<CenterProps> {
  public getClass(): new (props: unknown) => OperatorNode<CenterProps> {
    return CenterNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.center(this.props))
  }
}

type RotateProps = Parameters<InstanceType<typeof Shape>['rotate']>[0]

class RotateNode extends OperatorNode<RotateProps> {
  public getClass(): new (props: unknown) => OperatorNode<RotateProps> {
    return RotateNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.rotate(this.props))
  }
}

type ScaleProps = Parameters<InstanceType<typeof Shape>['scale']>[0]

class ScaleNode extends OperatorNode<ScaleProps> {
  public getClass(): new (props: unknown) => OperatorNode<ScaleProps> {
    return ScaleNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.scale(this.props))
  }
}

type TransformProps = Parameters<InstanceType<typeof Shape>['transform']>[0]

class TransformNode extends OperatorNode<TransformProps> {
  public getClass(): new (props: unknown) => OperatorNode<TransformProps> {
    return TransformNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.transform(this.props))
  }
}

type EntityProps = Parameters<InstanceType<typeof Shape>['set']>[0]

class EntityNode extends OperatorNode<EntityProps> {
  public getClass(): new (props: unknown) => OperatorNode<EntityProps> {
    return EntityNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.set(this.props))
  }
}

type PickProps = Parameters<InstanceType<typeof Shape>['pick']>[0]

class PickNode extends OperatorNode<PickProps> {
  public getClass(): new (props: unknown) => OperatorNode<PickProps> {
    return PickNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children.map((shape) => shape.pick(this.props)).filter((shape) => shape !== undefined)
  }
}

export const ShapeMapTransforms = {
  translate: TranslateNode,
  mirror: MirrorNode,
  scale: ScaleNode,
  rotate: RotateNode,
  center: CenterNode,
  transform: TransformNode,
  entity: EntityNode,
  pick: PickNode,
  layout: LayoutNode,
  layoutItem: LayoutItemNode,
} as const
