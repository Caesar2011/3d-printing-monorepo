import jscad from '@jscad/modeling'
import type { Vec3 } from '@jsxcad/core/dist/Vector3.js'

import { computePxPerMm, parseTransform, parseUnits, parseViewBox } from './attribute-parser.js'
import { parsePath } from './path-parser.js'
import type { SvgAttributes, SvgNode, Vec2 } from './types.js'

import type { SvgOutline, SvgOutlineGroup, SvgParseOptions } from './index.js'

const { maths } = jscad
type Mat4 = jscad.maths.mat4.Mat4

interface ProcessingContext {
  options: SvgParseOptions
  pmm: number
}

/** Processes SVG nodes into outline groups with solid/hole classification. */
export function extractOutlines(nodes: SvgNode[], options: SvgParseOptions): SvgOutlineGroup[] {
  const svgRoot = nodes.find((n) => n.tag === 'svg')
  const viewBox = parseViewBox(svgRoot?.attributes.viewBox)
  const pmm = computePxPerMm(svgRoot?.attributes.width, svgRoot?.attributes.height, viewBox)

  const ctx: ProcessingContext = { options, pmm }
  const groups: SvgOutlineGroup[] = []

  for (const node of nodes) {
    collectGroups(node, maths.mat4.create(), {}, ctx, groups)
  }

  return groups
}

function collectGroups(
  node: SvgNode,
  parentMatrix: Mat4,
  parentStyle: SvgAttributes,
  ctx: ProcessingContext,
  groups: SvgOutlineGroup[],
): void {
  const style = { ...parentStyle, ...parseStyle(node.attributes.style) }
  const localMatrix = parseTransform(node.attributes.transform)
  const matrix = localMatrix ? maths.mat4.multiply(maths.mat4.create(), parentMatrix, localMatrix) : parentMatrix

  const fillRule = node.attributes['fill-rule'] ?? style['fill-rule']

  switch (node.tag) {
    case 'rect': {
      const pts = rectToPoints(node.attributes, ctx.pmm)
      if (pts) {
        groups.push({ outlines: [{ points: transformPoints(pts, matrix), role: 'solid' }] })
      }
      break
    }
    case 'circle': {
      const pts = circleToPoints(node.attributes, ctx)
      if (pts) {
        groups.push({ outlines: [{ points: transformPoints(pts, matrix), role: 'solid' }] })
      }
      break
    }
    case 'ellipse': {
      const pts = ellipseToPoints(node.attributes, ctx)
      if (pts) {
        groups.push({ outlines: [{ points: transformPoints(pts, matrix), role: 'solid' }] })
      }
      break
    }
    case 'polygon':
    case 'polyline': {
      const pts = polyToPoints(node.attributes, ctx.pmm)
      if (pts) {
        groups.push({ outlines: [{ points: transformPoints(pts, matrix), role: 'solid' }] })
      }
      break
    }
    case 'path': {
      const d = node.attributes.d
      if (d != null) {
        const outlines = parsePath(d, ctx.options.segments)
        const processedOutlines = outlines
          .filter((o) => o.length >= 3)
          .map((outline) => {
            const scaled = outline.map(([x, y]) => [x / ctx.pmm, -y / ctx.pmm] as Vec2)
            return transformPoints(scaled, matrix)
          })

        if (processedOutlines.length > 0) {
          const classified = classifyOutlines(processedOutlines, fillRule)
          groups.push({ outlines: classified })
        }
      }
      break
    }
  }

  for (const child of node.children) {
    collectGroups(child, matrix, style, ctx, groups)
  }
}

function parseStyle(styleStr: string | undefined): SvgAttributes {
  if (styleStr == null) {
    return {}
  }
  const style: SvgAttributes = {}
  for (const declaration of styleStr.split(';')) {
    if (!declaration) {
      continue
    }
    const separatorIndex = declaration.indexOf(':')
    // Ensure a key is present and is not empty.
    if (separatorIndex > 0) {
      const key = declaration.substring(0, separatorIndex).trim()
      const value = declaration.substring(separatorIndex + 1).trim()
      style[key] = value
    }
  }
  return style
}

function transformPoints(points: Vec2[], matrix: Mat4): Vec2[] {
  // Check if matrix is identity
  const identity = maths.mat4.create()
  const isIdentity = matrix.every((v, i) => Math.abs(v - identity[i]) < 1e-10)
  if (isIdentity) return points

  return points.map(([x, y]) => {
    const vec = [x, y, 0] as Vec3
    const result = maths.vec3.transform(maths.vec3.create(), vec, matrix)
    return [result[0], result[1]] as Vec2
  })
}

function rectToPoints(attr: SvgAttributes, pmm: number): Vec2[] | undefined {
  const w = parseUnits(attr.width, pmm)
  const h = parseUnits(attr.height, pmm)
  if (w <= 0 || h <= 0) return undefined

  const x = parseUnits(attr.x, pmm)
  const y = -parseUnits(attr.y, pmm)

  // Counter-clockwise
  return [
    [x, y],
    [x + w, y],
    [x + w, y - h],
    [x, y - h],
  ]
}

function circleToPoints(attr: SvgAttributes, ctx: ProcessingContext): Vec2[] | undefined {
  const r = parseUnits(attr.r, ctx.pmm)
  if (r <= 0) return undefined

  const cx = parseUnits(attr.cx, ctx.pmm)
  const cy = -parseUnits(attr.cy, ctx.pmm)
  const segments = ctx.options.segments

  const points: Vec2[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return points
}

function ellipseToPoints(attr: SvgAttributes, ctx: ProcessingContext): Vec2[] | undefined {
  const rx = parseUnits(attr.rx, ctx.pmm)
  const ry = parseUnits(attr.ry, ctx.pmm)
  if (rx <= 0 || ry <= 0) return undefined

  const cx = parseUnits(attr.cx, ctx.pmm)
  const cy = -parseUnits(attr.cy, ctx.pmm)
  const segments = ctx.options.segments

  const points: Vec2[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)])
  }
  return points
}

function polyToPoints(attr: SvgAttributes, pmm: number): Vec2[] | undefined {
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
  return points
}

// --- Outline classification ---

/** Signed area of a polygon (positive = CCW, negative = CW). */
function signedArea(outline: Vec2[]): number {
  let area = 0
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    area += (outline[j][0] - outline[i][0]) * (outline[j][1] + outline[i][1])
  }
  return area / 2
}

/** Ray-casting point-in-polygon test. */
function outlineContainsPoint(outline: Vec2[], point: Vec2): boolean {
  const [px, py] = point
  let inside = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i]
    const [xj, yj] = outline[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function getInteriorPoint(outline: Vec2[]): Vec2 {
  if (outline.length < 3) return outline.length > 0 ? outline[0] : [0, 0]

  // First, try the centroid. It's fast and works for all convex and many non-convex polygons.
  let cx = 0
  let cy = 0
  for (const [x, y] of outline) {
    cx += x
    cy += y
  }
  const centroid: Vec2 = [cx / outline.length, cy / outline.length]
  if (outlineContainsPoint(outline, centroid)) {
    return centroid
  }

  // Fallback for complex non-convex polygons where the centroid is outside.
  // We find the midpoint of the longest segment and nudge it towards the polygon's interior.
  let p1 = outline[0]
  let p2 = outline[1]
  let maxLenSq = (p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2
  for (let i = 1; i < outline.length; i++) {
    const cp1 = outline[i]
    const cp2 = outline[(i + 1) % outline.length]
    const lenSq = (cp2[0] - cp1[0]) ** 2 + (cp2[1] - cp1[1]) ** 2
    if (lenSq > maxLenSq) {
      p1 = cp1
      p2 = cp2
      maxLenSq = lenSq
    }
  }

  const midPoint: Vec2 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
  const edgeVec: Vec2 = [p2[0] - p1[0], p2[1] - p1[1]]

  // Determine the inward normal based on the polygon's winding order (signed area).
  const area = signedArea(outline)
  const normal: Vec2 = area >= 0 ? [edgeVec[1], -edgeVec[0]] : [-edgeVec[1], edgeVec[0]]
  const normLen = Math.sqrt(normal[0] ** 2 + normal[1] ** 2)

  if (normLen < 1e-9) return centroid // Fallback for a degenerate segment

  // Nudge the point along the inward normal.
  const epsilon = 1e-6
  return [midPoint[0] + (normal[0] / normLen) * epsilon, midPoint[1] + (normal[1] / normLen) * epsilon]
}

function computeNestingDepth(outlines: Vec2[][], index: number): number {
  const testPoint = getInteriorPoint(outlines[index])
  const myArea = Math.abs(signedArea(outlines[index]))
  let depth = 0
  for (let j = 0; j < outlines.length; j++) {
    if (j === index) continue
    const otherArea = Math.abs(signedArea(outlines[j]))
    // An outline can only be contained within another outline that has a larger area.
    if (otherArea > myArea && outlineContainsPoint(outlines[j], testPoint)) {
      depth++
    }
  }
  return depth
}

function classifyOutlines(outlines: Vec2[][], fillRule: string | undefined): SvgOutline[] {
  if (outlines.length === 1) {
    return [{ points: outlines[0], role: 'solid' }]
  }

  return outlines.map((points, i) => {
    const depth = computeNestingDepth(outlines, i)

    if (fillRule === 'evenodd') {
      return { points, role: depth % 2 === 0 ? 'solid' : 'hole' } as SvgOutline
    }

    // Nonzero: use winding direction at nested depths
    if (depth === 0) {
      return { points, role: 'solid' } as SvgOutline
    }
    const area = signedArea(points)
    // This simplified logic for 'nonzero' is not fully compliant but handles many cases.
    // It assumes inner paths have opposite winding to be holes.
    return { points, role: area < 0 ? 'hole' : 'solid' } as SvgOutline
  })
}
