import { PrimitiveNode } from './PrimitiveNode.js'
import { Shape } from './Shape.js'

type CuboidProps = Parameters<typeof Shape.cuboid>[0]

class CuboidNode extends PrimitiveNode<CuboidProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<CuboidProps> {
    return CuboidNode
  }
  public renderFn(): Shape[] {
    return [Shape.cuboid(this.props)]
  }
}

type SphereProps = Parameters<typeof Shape.sphere>[0]

class SphereNode extends PrimitiveNode<SphereProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<SphereProps> {
    return SphereNode
  }
  public renderFn(): Shape[] {
    return [Shape.sphere(this.props)]
  }
}

type CylinderProps = Parameters<typeof Shape.cylinder>[0]

class CylinderNode extends PrimitiveNode<CylinderProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<CylinderProps> {
    return CylinderNode
  }
  public renderFn(): Shape[] {
    return [Shape.cylinder(this.props)]
  }
}

type PolygonProps = Parameters<typeof Shape.prism>[0]

class PrismNode extends PrimitiveNode<PolygonProps> {
  public getClass(): new (props: unknown) => PrimitiveNode<PolygonProps> {
    return PrismNode
  }
  public renderFn(): Shape[] {
    return [Shape.prism(this.props)]
  }
}

export const ShapeMapPrimitives = {
  cuboid: CuboidNode,
  sphere: SphereNode,
  cylinder: CylinderNode,
  prism: PrismNode,
} as const
