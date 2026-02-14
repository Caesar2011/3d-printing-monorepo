import jscad from '@jscad/modeling'

import { parseColor, parseTransform, parseUnits } from './attribute-parser.js'
import { parsePath } from './path-parser.js'
import type { SvgAttributes, SvgNode, SvgOptions, Vec2 } from './types.js'

const { maths, primitives, geometries } = jscad

type Geom2 = jscad.geometries.geom2.Geom2
type Mat4 = jscad.maths.mat4.Mat4

/** Processes a tree of SvgNodes into an array of Geom2 shapes. */
export function processNodes(nodes: SvgNode[], options: SvgOptions): Geom2[] {
  return nodes.flatMap((node) => processNode(node, maths.mat4.create(), {}, options))
}

function processNode(node: SvgNode, parentMatrix: Mat4, parentStyle: SvgAttributes, options: SvgOptions): Geom2[] {
  const style = { ...parentStyle, ...parseStyle(node.attributes.style) }
  const localMatrix = parseTransform(node.attributes.transform)
  const matrix = localMatrix ? maths.mat4.multiply(maths.mat4.create(), parentMatrix, localMatrix) : parentMatrix

  const results: Geom2[] = []

  let geom: Geom2 | undefined
  switch (node.tag) {
    case 'rect':
      geom = rectToGeom(node.attributes)
      break
    case 'circle':
      geom = circleToGeom(node.attributes, options)
      break
    case 'ellipse':
      geom = ellipseToGeom(node.attributes, options)
      break
    case 'polygon':
    case 'polyline':
      geom = polyToGeom(node.attributes)
      break
    case 'path':
      geom = pathToGeom(node.attributes, options)
      break
  }

  if (geom !== undefined) {
    const transformedGeom = geometries.geom2.transform(matrix, geom)
    const color = parseColor(node.attributes.fill ?? style.fill)
    if (color) {
      transformedGeom.color = color
    }
    results.push(transformedGeom)
  }

  // Recursively process children
  for (const child of node.children) {
    results.push(...processNode(child, matrix, style, options))
  }

  return results
}

function parseStyle(styleStr: string | undefined): SvgAttributes {
  if (styleStr === undefined) return {}
  const style: SvgAttributes = {}
  for (const decl of styleStr.split(';')) {
    const [key, value] = decl.split(':')
    if (key && value) {
      style[key.trim()] = value.trim()
    }
  }
  return style
}

function rectToGeom(attr: SvgAttributes): Geom2 | undefined {
  const w = parseUnits(attr.width)
  const h = parseUnits(attr.height)
  if (w <= 0 || h <= 0) return undefined

  const x = parseUnits(attr.x)
  const y = -parseUnits(attr.y) // SVG y-axis is inverted
  const rx = parseUnits(attr.rx)
  const ry = parseUnits(attr.ry)

  const radius = Math.max(rx, ry)
  const center: Vec2 = [x + w / 2, y - h / 2]

  if (radius > 0) {
    return primitives.roundedRectangle({ center, size: [w, h], roundRadius: radius, segments: 32 })
  }
  return primitives.rectangle({ center, size: [w, h] })
}

function circleToGeom(attr: SvgAttributes, options: SvgOptions): Geom2 | undefined {
  const r = parseUnits(attr.r)
  if (r <= 0) return undefined

  const cx = parseUnits(attr.cx)
  const cy = -parseUnits(attr.cy)
  return primitives.circle({ center: [cx, cy], radius: r, segments: options.segments })
}

function ellipseToGeom(attr: SvgAttributes, options: SvgOptions): Geom2 | undefined {
  const rx = parseUnits(attr.rx)
  const ry = parseUnits(attr.ry)
  if (rx <= 0 || ry <= 0) return undefined

  const cx = parseUnits(attr.cx)
  const cy = -parseUnits(attr.cy)
  return primitives.ellipse({ center: [cx, cy], radius: [rx, ry], segments: options.segments })
}

function polyToGeom(attr: SvgAttributes): Geom2 | undefined {
  const pointsStr = attr.points
  if (!pointsStr) return undefined

  const points: Vec2[] = []
  const pairs = pointsStr.trim().split(/[\s,]+/)
  for (let i = 0; i < pairs.length; i += 2) {
    points.push([parseFloat(pairs[i]), -parseFloat(pairs[i + 1])])
  }

  if (points.length < 3) return undefined
  return geometries.geom2.fromPoints(points.map((p) => [parseUnits(p[0].toString()), parseUnits(p[1].toString())]))
}

function pathToGeom(attr: SvgAttributes, options: SvgOptions): Geom2 | undefined {
  const d = attr.d
  if (!d) return undefined

  const outlines = parsePath(d, options.segments)
  if (outlines.length === 0) return undefined

  const pmm = 3.54 // TODO: make configurable from viewBox
  const scaledOutlines = outlines.map((outline) => outline.map(([x, y]) => [x / pmm, -y / pmm] as Vec2))

  if (attr['fill-rule'] === 'evenodd') {
    const allSides = scaledOutlines.flatMap((outline) => {
      const sides: [Vec2, Vec2][] = []
      for (let i = 0; i < outline.length; i++) {
        sides.push([outline[i], outline[(i + 1) % outline.length]])
      }
      return sides
    })
    return jscad.geometries.geom2.create(allSides)
  }

  // Default is 'nonzero': use winding order
  let result: Geom2 | undefined
  for (const outline of scaledOutlines) {
    const geom = jscad.geometries.geom2.fromPoints(outline)
    if (result == undefined) {
      result = geom
    } else {
      // Winding direction determines if it's a hole (subtract) or a new solid (union)
      const area = jscad.measurements.measureArea(geom)
      result = (area > 0 ? jscad.booleans.union : jscad.booleans.subtract)(result, geom) as Geom2
    }
  }

  return result
}
