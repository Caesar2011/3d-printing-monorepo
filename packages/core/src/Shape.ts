import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Color, Geom3, Poly3 } from '@jscad/modeling/src/geometries/types.js'
import type { Mat4 } from '@jscad/modeling/src/maths/types.js'
import type { CylinderOptions, SphereOptions } from '@jscad/modeling/src/primitives/index.js'
import jscad from '@jscad/modeling'

import type { AxisRecordDefinition, UniqueAxisString } from './Vector3.js'
import { axisOrRecordToVec3, V } from './Vector3.js'
import { logger } from './logger.js'
import { svgToGeom2s } from './svg/index.js'

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
    this.color = Shape.color ?? props.color
    this.type = props.type ?? ShapeType.Unspecified
    this.name =
      props.name !== undefined && props.name !== ''
        ? props.name
        : this.type !== ShapeType.Unspecified
          ? ShapeType[this.type]
          : ''
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
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }

  public static cylinder(
    props: { size: AxisRecordDefinition; segments: number; center?: AxisRecordDefinition } & ShapeProperties,
  ) {
    const opts: CylinderOptions = { radius: 0.5, height: 1, segments: props.segments }
    const shape = new Shape(primitives.cylinder(opts), props).scale({ by: props.size })
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }

  public static cuboid(props: { size: AxisRecordDefinition; center?: AxisRecordDefinition } & ShapeProperties) {
    const shape = new Shape(primitives.cube({ size: 1 }), props).scale({ by: props.size })
    return shape.translate({ by: props.center !== undefined ? props.center : V(props.size).d(2) })
  }

  /** Creates a 3D shape by loading an SVG, optionally scaling it to fill the given size, and extruding to the given z height. */
  public static svgfile(
    props: {
      file: string
      size: AxisRecordDefinition
      segments?: number
      center?: AxisRecordDefinition
      fillSize?: boolean
    } & ShapeProperties,
  ) {
    const svgSource = loadSvgSource(props.file)
    const geom2s = svgToGeom2s(svgSource, { segments: props.segments ?? 32 })

    if (geom2s.length === 0) {
      throw new Error(`SVG file produced no geometry: ${props.file}`)
    }

    const sizeVec = V(props.size)
    const height = sizeVec.v[2]

    const geom3s: Geom3[] = []
    for (const g of geom2s) {
      try {
        geom3s.push(extrusions.extrudeLinear({ height }, g))
      } catch (e) {
        logger.debug(`SVG: skipping non-extrudable geom2 (${e instanceof Error ? e.message : e}) in ${props.file}`)
      }
    }

    if (geom3s.length === 0) {
      throw new Error(`SVG file produced no extrudable geometry: ${props.file}`)
    }

    const combined: Geom3 = geom3s.length === 1 ? geom3s[0] : booleans.union(geom3s)

    // Move to origin first so we can reason about the SVG bounds cleanly
    let shape = new Shape(combined, props).translate({ fromOrigin: 'xyz' })

    const [, svgMax] = measurements.measureBoundingBox(shape)
    const svgW = svgMax[0]
    const svgH = svgMax[1]

    const targetW = sizeVec.v[0]
    const targetH = sizeVec.v[1]

    if (props.fillSize === true) {
      // Scale the SVG to exactly fill the target x/y dimensions
      const scaleX = targetW / svgW
      const scaleY = targetH / svgH
      shape = shape.scale({ by: { x: scaleX, y: scaleY, z: 1 } })
    } else {
      // Uniform scale to fit within target, then center within the target area
      const scaleFactor = Math.min(targetW / svgW, targetH / svgH)
      shape = shape.scale({ by: { x: scaleFactor, y: scaleFactor, z: 1 } })

      const scaledW = svgW * scaleFactor
      const scaledH = svgH * scaleFactor
      const offsetX = (targetW - scaledW) / 2
      const offsetY = (targetH - scaledH) / 2
      shape = shape.translate({ by: { x: offsetX, y: offsetY } })
    }

    if (props.center !== undefined) {
      return shape.translate({ by: props.center })
    }
    return shape
  }
}

function loadSvgSource(uri: string): string {
  if (uri.startsWith('data:')) {
    const commaIndex = uri.indexOf(',')
    if (commaIndex === -1) throw new Error('Malformed data: URL')
    const meta = uri.slice(0, commaIndex)
    const encoded = uri.slice(commaIndex + 1)
    return meta.includes(';base64') ? Buffer.from(encoded, 'base64').toString('utf-8') : decodeURIComponent(encoded)
  }

  if (uri.startsWith('file://')) {
    uri = fileURLToPath(uri)
  }

  const resolved = path.isAbsolute(uri) ? uri : path.resolve(process.cwd(), uri)
  if (!fs.existsSync(resolved)) throw new Error(`SVG file not found: ${resolved}`)
  return fs.readFileSync(resolved, 'utf-8')
}
