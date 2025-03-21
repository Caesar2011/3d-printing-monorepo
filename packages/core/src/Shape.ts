import type { Color, Geom3, Poly3 } from '@jscad/modeling/src/geometries/types.js'
import type { Mat4 } from '@jscad/modeling/src/maths/types.js'
import type { CylinderOptions, SphereOptions } from '@jscad/modeling/src/primitives/index.js'
import jscad from '@jscad/modeling'

import type { AxisRecordDefinition, UniqueAxisString } from './Vector3.js'
import { axisOrRecordToVec3, V } from './Vector3.js'
const { booleans, colors, maths, measurements, primitives, transforms } = jscad

export enum ShapeType {
  Unspecified,
  Content,
  Part,
  Lid,
  Magnet,
  Technical,
}

export class Shape implements Geom3 {
  public readonly polygons: Poly3[]
  public readonly transforms: Mat4 = maths.mat4.create()
  public readonly color?: Color

  constructor(
    Shape: Geom3,
    public readonly name: string = 'part',
    public readonly type: ShapeType = ShapeType.Unspecified,
  ) {
    this.polygons = Shape.polygons
    this.transforms = Shape.transforms
    this.color = Shape.color
  }

  public setName(name: string): Shape {
    return new Shape(this, name, this.type)
  }

  public setType(type: ShapeType): Shape {
    return new Shape(this, this.name, type)
  }

  public setColor(color: Color) {
    return new Shape(colors.colorize(color, this), this.name, this.type)
  }

  public translate(opts: { by?: AxisRecordDefinition; fromOrigin?: UniqueAxisString }) {
    let origin = V()
    if (opts.fromOrigin) {
      const box = V(measurements.measureBoundingBox(this)[0])
      origin = origin.a({ [opts.fromOrigin]: box.m(-1) })
    }
    const vec = V(opts.by).a(origin)
    return new Shape(transforms.translate(vec.v, this), this.name, this.type)
  }

  public center(opts: { axes?: [boolean, boolean, boolean]; relativeTo?: AxisRecordDefinition }) {
    const centerOpts = {
      ...(opts.relativeTo === undefined ? {} : { relativeTo: axisOrRecordToVec3(opts.relativeTo) }),
      ...(opts.axes === undefined ? {} : { axes: opts.axes }),
    }
    return new Shape(transforms.center(centerOpts, this), this.name, this.type)
  }

  public scale(opts: { by: AxisRecordDefinition }) {
    const vec = axisOrRecordToVec3(opts.by)
    return new Shape(transforms.scale(vec, this), this.name, this.type)
  }

  public mirror(opts: { origin?: AxisRecordDefinition; normal?: AxisRecordDefinition }) {
    const mirrorOpts = {
      ...(opts.origin === undefined ? {} : { origin: axisOrRecordToVec3(opts.origin) }),
      ...(opts.normal === undefined ? {} : { normal: axisOrRecordToVec3(opts.normal) }),
    }
    return new Shape(transforms.mirror(mirrorOpts, this), this.name, this.type)
  }

  public rotate(opts: { by: AxisRecordDefinition }) {
    const vec = axisOrRecordToVec3(opts.by)
    return new Shape(transforms.rotate(vec, this), this.name, this.type)
  }

  public transform(opts: { mat4: Mat4 }) {
    return new Shape(transforms.transform(opts.mat4, this), this.name, this.type)
  }

  public static union(geoms: Shape[]) {
    const first = geoms.at(0)
    if (!first) throw new Error('Union must contain at least one geom')
    return new Shape(booleans.union(geoms), first.name, first.type)
  }

  public static subtract(geoms: Shape[]) {
    const first = geoms.at(0)
    if (!first) throw new Error('Subtract must contain at least one geom')
    return new Shape(booleans.subtract(...geoms), first.name, first.type)
  }

  public static intersect(geoms: Shape[]) {
    const first = geoms.at(0)
    if (!first) throw new Error('Intersect must contain at least one geom')
    return new Shape(booleans.intersect(...geoms), first.name, first.type)
  }

  public static sphere(props: { size: AxisRecordDefinition; segments?: number; center?: AxisRecordDefinition }) {
    const opts: SphereOptions = { radius: 0.5, segments: props.segments }
    const shape = new Shape(primitives.sphere(opts)).scale({ by: props.size })
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }

  public static cylinder(props: { size: AxisRecordDefinition; segments?: number; center?: AxisRecordDefinition }) {
    const opts: CylinderOptions = { radius: 0.5, height: 1, segments: props.segments }
    const shape = new Shape(primitives.cylinder(opts)).scale({ by: props.size })
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }

  public static cuboid(props: { size: AxisRecordDefinition; center?: AxisRecordDefinition }) {
    const shape = new Shape(primitives.cube({ size: 1 })).scale({ by: props.size })
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }
}
