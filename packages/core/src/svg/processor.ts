import jscad from '@jscad/modeling'

import { computePxPerMm, parseColor, parseTransform, parseUnits, parseViewBox } from './attribute-parser.js'
import { assembleEvenOdd, assembleNonZero } from './geometry-utils.js'
import { parsePath } from './path-parser.js'
import type { SvgAttributes, SvgNode, SvgOptions, Vec2 } from './types.js'

const { maths, primitives, geometries } = jscad

type Geom2 = jscad.geometries.geom2.Geom2
type Mat4 = jscad.maths.mat4.Mat4

interface ProcessingContext {
  options: SvgOptions
  pmm: number
}

/** Processes a tree of SvgNodes into an array of Geom2 shapes. */
export function processNodes(nodes: SvgNode[], options: SvgOptions): Geom2[] {
  // Find the root <svg> element to extract viewBox and dimensions
  const svgRoot = nodes.find((n) => n.tag === 'svg')
  const viewBox = parseViewBox(svgRoot?.attributes.viewBox)
  const pmm = computePxPerMm(svgRoot?.attributes.width, svgRoot?.attributes.height, viewBox)

  const ctx: ProcessingContext = { options, pmm }
  return nodes.flatMap((node) => processNode(node, maths.mat4.create(), {}, ctx))
}

function processNode(node: SvgNode, parentMatrix: Mat4, parentStyle: SvgAttributes, ctx: ProcessingContext): Geom2[] {
  const style = { ...parentStyle, ...parseStyle(node.attributes.style) }
  const localMatrix = parseTransform(node.attributes.transform)
  const matrix = localMatrix ? maths.mat4.multiply(maths.mat4.create(), parentMatrix, localMatrix) : parentMatrix

  // Resolve fill-rule: attribute takes precedence over inherited style
  const fillRule = node.attributes['fill-rule'] ?? style['fill-rule']

  const results: Geom2[] = []

  let geom: Geom2 | undefined
  switch (node.tag) {
    case 'rect':
      geom = rectToGeom(node.attributes, ctx.pmm)
      break
    case 'circle':
      geom = circleToGeom(node.attributes, ctx)
      break
    case 'ellipse':
      geom = ellipseToGeom(node.attributes, ctx)
      break
    case 'line':
      geom = lineToGeom(node.attributes, ctx.pmm)
      break
    case 'polygon':
    case 'polyline':
      geom = polyToGeom(node.attributes, ctx.pmm)
      break
    case 'path':
      geom = pathToGeom(node.attributes, ctx, fillRule)
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

  for (const child of node.children) {
    results.push(...processNode(child, matrix, style, ctx))
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

function rectToGeom(attr: SvgAttributes, pmm: number): Geom2 | undefined {
  const w = parseUnits(attr.width, pmm)
  const h = parseUnits(attr.height, pmm)
  if (w <= 0 || h <= 0) return undefined

  const x = parseUnits(attr.x, pmm)
  const y = -parseUnits(attr.y, pmm)
  const rx = parseUnits(attr.rx, pmm)
  const ry = parseUnits(attr.ry, pmm)

  const radius = Math.max(rx, ry)
  const center: Vec2 = [x + w / 2, y - h / 2]

  if (radius > 0) {
    return primitives.roundedRectangle({ center, size: [w, h], roundRadius: radius, segments: 32 })
  }
  return primitives.rectangle({ center, size: [w, h] })
}

function circleToGeom(attr: SvgAttributes, ctx: ProcessingContext): Geom2 | undefined {
  const r = parseUnits(attr.r, ctx.pmm)
  if (r <= 0) return undefined

  const cx = parseUnits(attr.cx, ctx.pmm)
  const cy = -parseUnits(attr.cy, ctx.pmm)
  return primitives.circle({ center: [cx, cy], radius: r, segments: ctx.options.segments })
}

function ellipseToGeom(attr: SvgAttributes, ctx: ProcessingContext): Geom2 | undefined {
  const rx = parseUnits(attr.rx, ctx.pmm)
  const ry = parseUnits(attr.ry, ctx.pmm)
  if (rx <= 0 || ry <= 0) return undefined

  const cx = parseUnits(attr.cx, ctx.pmm)
  const cy = -parseUnits(attr.cy, ctx.pmm)
  return primitives.ellipse({ center: [cx, cy], radius: [rx, ry], segments: ctx.options.segments })
}

function lineToGeom(attr: SvgAttributes, pmm: number): Geom2 | undefined {
  const x1 = parseUnits(attr.x1, pmm)
  const y1 = -parseUnits(attr.y1, pmm)
  const x2 = parseUnits(attr.x2, pmm)
  const y2 = -parseUnits(attr.y2, pmm)

  if (x1 === x2 && y1 === y2) return undefined

  // A line has no fill area; represent as a degenerate polygon for extrusion compatibility
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const nx = (-dy / len) * 0.01
  const ny = (dx / len) * 0.01

  return geometries.geom2.fromPoints([
    [x1 + nx, y1 + ny],
    [x2 + nx, y2 + ny],
    [x2 - nx, y2 - ny],
    [x1 - nx, y1 - ny],
  ])
}

function polyToGeom(attr: SvgAttributes, pmm: number): Geom2 | undefined {
  const pointsStr = attr.points
  if (pointsStr === undefined) return undefined

  const values = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(parseFloat)
  const points: Vec2[] = []
  for (let i = 0; i + 1 < values.length; i += 2) {
    if (isNaN(values[i]) || isNaN(values[i + 1])) continue
    points.push([values[i] / pmm, -values[i + 1] / pmm])
  }

  if (points.length < 3) return undefined
  return geometries.geom2.fromPoints(points)
}

function pathToGeom(attr: SvgAttributes, ctx: ProcessingContext, fillRule: string | undefined): Geom2 | undefined {
  const d = attr.d
  if (d === undefined) return undefined

  const outlines = parsePath(d, ctx.options.segments)
  if (outlines.length === 0) return undefined

  const scaledOutlines = outlines.map((outline) => outline.map(([x, y]) => [x / ctx.pmm, -y / ctx.pmm] as Vec2))

  if (fillRule === 'evenodd') {
    return assembleEvenOdd(scaledOutlines)
  }

  return assembleNonZero(scaledOutlines)
}
