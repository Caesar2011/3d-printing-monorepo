import type { Color, Geom3, Poly3 } from '@jscad/modeling/src/geometries/types.js'
import type { Mat4 } from '@jscad/modeling/src/maths/types.js'
import type { CylinderOptions, SphereOptions } from '@jscad/modeling/src/primitives/index.js'
import jscad from '@jscad/modeling'

import { Colors } from './Colors.js'
import type { AxisRecordDefinition, UniqueAxisString } from './Vector3.js'
import { axisOrRecordToVec3, V } from './Vector3.js'

const { booleans, maths, measurements, primitives, transforms, hulls, extrusions } = jscad

export enum ShapeType {
  Unspecified,
  Content,
  Part,
  Lid,
  Magnet,
  Technical,
}

export type ShapeProperties = { name?: string; type?: ShapeType; color?: Color }

export class Shape implements Geom3 {
  public readonly polygons: Poly3[]
  public readonly transforms: Mat4 = maths.mat4.create()
  public readonly color?: Color
  public readonly name: string
  public readonly type: ShapeType

  constructor(Shape: Geom3, props: ShapeProperties) {
    this.polygons = Shape.polygons
    this.transforms = Shape.transforms
    this.type = props.type ?? ShapeType.Unspecified
    this.name =
      props.name !== undefined && props.name !== ''
        ? props.name
        : this.type !== ShapeType.Unspecified
          ? ShapeType[this.type]
          : ''

    this.color = Shape.color ?? props.color
    if (this.color === undefined) {
      switch (this.type) {
        case ShapeType.Content:
          this.color = Colors.GREEN_1
          break
        case ShapeType.Lid:
          this.color = Colors.ORANGE_1
          break
        case ShapeType.Magnet:
          this.color = Colors.PURPLE_1
          break
        case ShapeType.Technical:
          this.color = Colors.PINK_1
          break
      }
    }
  }

  private mergeProps(newProps: ShapeProperties): ShapeProperties {
    return Shape.mergeProps(this, newProps)
  }

  private static mergeProps(oldProps: ShapeProperties, newProps: ShapeProperties): ShapeProperties {
    const name =
      newProps.name !== undefined && newProps.name !== '' && oldProps.name !== undefined && oldProps.name !== ''
        ? { name: `${newProps.name}-${oldProps.name}` }
        : undefined

    return { ...oldProps, ...newProps, ...name }
  }

  public set(props: ShapeProperties): Shape {
    return new Shape(this, this.mergeProps(props))
  }

  public translate(props: { by?: AxisRecordDefinition; fromOrigin?: UniqueAxisString } & ShapeProperties) {
    let origin = V()
    if (props.fromOrigin) {
      const box = V(measurements.measureBoundingBox(this)[0])
      origin = origin.a({ [props.fromOrigin]: box.m(-1) })
    }
    const vec = V(props.by).a(origin)
    return new Shape(transforms.translate(vec.v, this), this.mergeProps(props))
  }

  public center(props: { axes?: [boolean, boolean, boolean]; relativeTo?: AxisRecordDefinition } & ShapeProperties) {
    const centerOpts = {
      ...(props.relativeTo === undefined ? {} : { relativeTo: axisOrRecordToVec3(props.relativeTo) }),
      ...(props.axes === undefined ? {} : { axes: props.axes }),
    }
    return new Shape(transforms.center(centerOpts, this), this.mergeProps(props))
  }

  public scale(props: { by: AxisRecordDefinition } & ShapeProperties) {
    const vec = axisOrRecordToVec3(props.by)
    return new Shape(transforms.scale(vec, this), this.mergeProps(props))
  }

  public mirror(props: { origin?: AxisRecordDefinition; normal?: AxisRecordDefinition } & ShapeProperties) {
    const mirrorOpts = {
      ...(props.origin === undefined ? {} : { origin: axisOrRecordToVec3(props.origin) }),
      ...(props.normal === undefined ? {} : { normal: axisOrRecordToVec3(props.normal) }),
    }
    return new Shape(transforms.mirror(mirrorOpts, this), this.mergeProps(props))
  }

  public rotate(props: { by: AxisRecordDefinition; center?: AxisRecordDefinition } & ShapeProperties) {
    const vec = axisOrRecordToVec3(props.by)
    if (props.center !== undefined) {
      const center = axisOrRecordToVec3(props.center)
      const centerRev = V(center).m(-1).v
      return new Shape(
        transforms.translate(center, transforms.rotate(vec, transforms.translate(centerRev, this))),
        this.mergeProps(props),
      )
    }
    return new Shape(transforms.rotate(vec, this), this.mergeProps(props))
  }

  public transform(props: { mat4: Mat4 } & ShapeProperties) {
    return new Shape(transforms.transform(props.mat4, this), this.mergeProps(props))
  }

  public pick(
    props: { typeWhitelist?: ShapeType[]; typeBlacklist?: ShapeType[]; nameRegex?: string } & ShapeProperties,
  ) {
    if (!(props.typeWhitelist?.includes(this.type) ?? true)) {
      return undefined
    }
    if (props.typeBlacklist?.includes(this.type) ?? false) {
      return undefined
    }
    if (props.nameRegex !== undefined && !new RegExp(props.nameRegex).test(this.name)) {
      return undefined
    }

    return this
  }

  public static union(geoms: Shape[], props: ShapeProperties) {
    const first = geoms.at(0)
    if (!first) throw new Error('Union must contain at least one geom')
    return new Shape(booleans.union(geoms), Shape.mergeProps(first, props))
  }

  public static subtract(geoms: Shape[], props: ShapeProperties) {
    const first = geoms.at(0)
    if (!first) throw new Error('Subtract must contain at least one geom')
    return new Shape(booleans.subtract(...geoms), Shape.mergeProps(first, props))
  }

  public static intersect(geoms: Shape[], props: ShapeProperties) {
    const first = geoms.at(0)
    if (!first) throw new Error('Intersect must contain at least one geom')
    return new Shape(booleans.intersect(...geoms), Shape.mergeProps(first, props))
  }

  public static hull(geoms: Shape[], props: ShapeProperties) {
    const first = geoms.at(0)
    if (!first) throw new Error('Hull must contain at least one geom')
    return new Shape(hulls.hull(geoms), Shape.mergeProps(first, props))
  }

  public static sphere(
    props: { size: AxisRecordDefinition; segments: number; center?: AxisRecordDefinition } & ShapeProperties,
  ) {
    const opts: SphereOptions = { radius: 0.5, segments: props.segments }
    const shape = new Shape(primitives.sphere(opts), props).scale({ by: props.size })
    return shape.translate({ by: props.center ?? V(props.size).d(2) })
  }

  public static cylinder(
    props: { size: AxisRecordDefinition; segments: number; center?: AxisRecordDefinition } & ShapeProperties,
  ) {
    const opts: CylinderOptions = { radius: 0.5, height: 1, segments: props.segments }
    const shape = new Shape(primitives.cylinder(opts), props).scale({ by: props.size })
    return shape.translate({ by: props.center ?? V(props.size).d(2) })
  }

  public static cuboid(props: { size: AxisRecordDefinition; center?: AxisRecordDefinition } & ShapeProperties) {
    const shape = new Shape(primitives.cube({ size: 1 }), props).scale({ by: props.size })
    return shape.translate({ by: props.center ?? V(props.size).d(2) })
  }

  /** Creates a 3D shape by extruding a closed 2D polygon to the given height. Points must be in counter-clockwise order. */
  public get volume(): number {
    return measurements.measureVolume(this)
  }

  public static prism(
    props: {
      points: AxisRecordDefinition[]
      height: number
      center?: AxisRecordDefinition
    } & ShapeProperties,
  ) {
    if (props.points.length < 3) {
      throw new Error('Polygon must have at least 3 points')
    }

    const points = props.points.map((point) => V(point).v.slice(0, 2) as [number, number])

    const geom2 = primitives.polygon({ points })
    const geom3 = extrusions.extrudeLinear({ height: props.height }, geom2)
    const shape = new Shape(geom3, props)

    if (props.center !== undefined) {
      return shape.translate({ by: props.center })
    }
    return shape
  }
}
