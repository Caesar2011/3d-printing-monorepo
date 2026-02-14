import jscad from '@jscad/modeling'

import type { Vec2 } from './types.js'

type Geom2 = jscad.geometries.geom2.Geom2

/** Ray-casting point-in-polygon test. */
export function outlineContainsPoint(outline: Vec2[], point: Vec2): boolean {
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

/** Signed area of a polygon (positive = CCW, negative = CW). */
function signedArea(outline: Vec2[]): number {
  let area = 0
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    area += (outline[j][0] - outline[i][0]) * (outline[j][1] + outline[i][1])
  }
  return area / 2
}

/**
 * Finds a point reliably inside the outline for containment testing.
 * Uses the midpoint of the first non-degenerate edge, nudged inward.
 */
function getInteriorPoint(outline: Vec2[]): Vec2 {
  if (outline.length < 3) return outline.length > 0 ? outline[0] : [0, 0]

  const windingSign = signedArea(outline) >= 0 ? 1 : -1

  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i]
    const p2 = outline[(i + 1) % outline.length]
    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const len = Math.sqrt(dx * dx + dy * dy)

    if (len > 1e-9) {
      // Inward normal depends on winding direction
      const nx = (-dy / len) * windingSign * 1e-5
      const ny = (dx / len) * windingSign * 1e-5
      const candidate: Vec2 = [(p1[0] + p2[0]) / 2 + nx, (p1[1] + p2[1]) / 2 + ny]
      if (outlineContainsPoint(outline, candidate)) {
        return candidate
      }
    }
  }

  // Fallback to centroid if all else fails
  let cx = 0,
    cy = 0
  for (const [x, y] of outline) {
    cx += x
    cy += y
  }
  return [cx / outline.length, cy / outline.length]
}

/**
 * Computes the nesting depth of each outline by counting how many
 * other outlines contain a representative point of it.
 */
function computeNestingDepths(outlines: Vec2[][]): number[] {
  const testPoints = outlines.map(getInteriorPoint)

  return outlines.map((_, i) => {
    let depth = 0
    for (let j = 0; j < outlines.length; j++) {
      if (i === j) continue
      if (outlineContainsPoint(outlines[j], testPoints[i])) {
        depth++
      }
    }
    return depth
  })
}

/**
 * Assembles multiple subpath outlines into a single Geom2 using the even-odd rule.
 * A subpath at even nesting depth is a solid; at odd depth it is a hole.
 */
export function assembleEvenOdd(outlines: Vec2[][]): Geom2 | undefined {
  const valid = outlines.filter((o) => o.length >= 3)
  if (valid.length === 0) return undefined

  const geoms = valid.map((o) => jscad.geometries.geom2.fromPoints(o))
  const depths = computeNestingDepths(valid)

  const geomsByDepth: Map<number, Geom2[]> = new Map()
  let maxDepth = 0
  depths.forEach((depth, i) => {
    if (!geomsByDepth.has(depth)) {
      geomsByDepth.set(depth, [])
    }
    geomsByDepth.get(depth)!.push(geoms[i])
    if (depth > maxDepth) maxDepth = depth
  })

  const solidsAtDepth0 = geomsByDepth.get(0)
  if (!solidsAtDepth0 || solidsAtDepth0.length === 0) {
    // This happens with shapes that are effectively all holes.
    return undefined
  }

  let result: Geom2 = jscad.booleans.union(...solidsAtDepth0) as Geom2

  for (let d = 1; d <= maxDepth; d++) {
    const geomsAtDepth = geomsByDepth.get(d)
    if (!geomsAtDepth || geomsAtDepth.length === 0) continue

    const shapesAtDepth = jscad.booleans.union(...geomsAtDepth) as Geom2

    if (d % 2 === 1) {
      // Odd depth => hole
      result = jscad.booleans.subtract(result, shapesAtDepth) as Geom2
    } else {
      // Even depth => solid
      result = jscad.booleans.union(result, shapesAtDepth) as Geom2
    }
  }

  return result
}

/**
 * Assembles multiple subpath outlines into a single Geom2 using the nonzero winding rule.
 * Uses nesting depth combined with winding direction to determine solids vs holes.
 */
export function assembleNonZero(outlines: Vec2[][]): Geom2 | undefined {
  const valid = outlines.filter((o) => o.length >= 3)
  if (valid.length === 0) return undefined

  const geoms = valid.map((o) => jscad.geometries.geom2.fromPoints(o))
  const depths = computeNestingDepths(valid)

  const solids: Geom2[] = []
  const holes: Geom2[] = []

  for (let i = 0; i < geoms.length; i++) {
    const area = jscad.measurements.measureArea(geoms[i])
    const isClockwise = area < 0

    if (depths[i] === 0) {
      solids.push(geoms[i])
    } else if (isClockwise) {
      holes.push(geoms[i])
    } else {
      solids.push(geoms[i])
    }
  }

  if (solids.length === 0) return undefined

  let result: Geom2 = solids.length === 1 ? solids[0] : (jscad.booleans.union(...solids) as Geom2)

  if (holes.length > 0) {
    result = jscad.booleans.subtract(result, ...holes) as Geom2
  }

  return result
}
