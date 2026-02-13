import { V, type Vector3 } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings } from './types.js'

export type ResolvedCutout = Required<CutoutSettings>

export type CutoutPlacement = {
  /** Size of the cutout slab (x=width along face, y=height along face, z=depth through wall) */
  size: Vector3
  /** Translation to position the cutout on the container */
  translation: Vector3
  /** Rotation to orient the cutout on the correct face */
  rotation: Vector3
  /** The resolved cutout settings */
  settings: ResolvedCutout
}

/**
 * For each edge of a face, determines how much the container corner radius
 * eats into the available flat area. Returns 0 if that edge is not filleted.
 *
 * The insets are named relative to the face's own 2D coordinate system:
 * - start/end: along the face's width
 * - bottom/top: along the face's height
 */
type FaceEdgeInsets = {
  start: number
  end: number
  bottom: number
  top: number
}

// Helper: check if a specific side-edge bit is set
// Side edges (vertical) are bits 4-7: front-left=0x80, back-left=0x40, back-right=0x20, front-right=0x10
const SIDE_FL = 0b0000_1000_0000
const SIDE_BL = 0b0000_0100_0000
const SIDE_BR = 0b0000_0010_0000
const SIDE_FR = 0b0000_0001_0000

// Bottom edges are bits 0-3
const BOT_FRONT = 0b0000_0000_1000
const BOT_LEFT = 0b0000_0000_0100
const BOT_BACK = 0b0000_0000_0010
const BOT_RIGHT = 0b0000_0000_0001

// Top edges are bits 8-11
const TOP_FRONT = 0b1000_0000_0000
const TOP_LEFT = 0b0100_0000_0000
const TOP_BACK = 0b0010_0000_0000
const TOP_RIGHT = 0b0001_0000_0000

function has(edges: Edge, bit: number): boolean {
  return (edges & bit) !== 0
}

function getFaceEdgeInsets(
  face: 'bottom' | 'front' | 'left' | 'back' | 'right',
  edges: Edge,
  radius: number,
): FaceEdgeInsets {
  switch (face) {
    // Bottom face: lies in XY plane. Width=X, Height=Y.
    // start=left(X-), end=right(X+), bottom=front(Y-), top=back(Y+)
    case 'bottom':
      return {
        start: has(edges, BOT_LEFT) ? radius : 0,
        end: has(edges, BOT_RIGHT) ? radius : 0,
        bottom: has(edges, BOT_FRONT) ? radius : 0,
        top: has(edges, BOT_BACK) ? radius : 0,
      }
    // Front face: at Y=0, facing -Y. Width along X, height along Z.
    // start=left side (front-left vertical edge), end=right side (front-right vertical edge)
    // bottom=bottom-front edge, top=top-front edge
    case 'front':
      return {
        start: has(edges, SIDE_FL) ? radius : 0,
        end: has(edges, SIDE_FR) ? radius : 0,
        bottom: has(edges, BOT_FRONT) ? radius : 0,
        top: has(edges, TOP_FRONT) ? radius : 0,
      }
    // Back face: at Y=max, facing +Y. Width along X, height along Z.
    // When looking at back from outside: left=right side of container, right=left side
    // start=back-right vertical edge, end=back-left vertical edge
    case 'back':
      return {
        start: has(edges, SIDE_BR) ? radius : 0,
        end: has(edges, SIDE_BL) ? radius : 0,
        bottom: has(edges, BOT_BACK) ? radius : 0,
        top: has(edges, TOP_BACK) ? radius : 0,
      }
    // Left face: at X=0, facing -X. Width along Y, height along Z.
    // start=front-left vertical edge, end=back-left vertical edge
    case 'left':
      return {
        start: has(edges, SIDE_FL) ? radius : 0,
        end: has(edges, SIDE_BL) ? radius : 0,
        bottom: has(edges, BOT_LEFT) ? radius : 0,
        top: has(edges, TOP_LEFT) ? radius : 0,
      }
    // Right face: at X=max, facing +X. Width along Y, height along Z.
    // start=front-right vertical edge, end=back-right vertical edge
    case 'right':
      return {
        start: has(edges, SIDE_FR) ? radius : 0,
        end: has(edges, SIDE_BR) ? radius : 0,
        bottom: has(edges, BOT_RIGHT) ? radius : 0,
        top: has(edges, TOP_RIGHT) ? radius : 0,
      }
  }
}

/**
 * Computes all cutout placements for a container.
 *
 * Coordinate system: X=right, Y=back, Z=up.
 * Container origin is at (0,0,0), extends to (cx,cy,cz).
 * Walls are `wall` thick on all 4 sides, floor is `floor` thick at bottom, open at top.
 *
 * Each cutout is produced as a flat XY slab (width × height × depth) that gets
 * rotated and translated into position on the container.
 */
export function computeCutoutPlacements(
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  cutouts: Partial<Record<'bottom' | 'front' | 'left' | 'back' | 'right', ResolvedCutout>>,
): CutoutPlacement[] {
  const placements: CutoutPlacement[] = []
  const cx = containerSize.x
  const cy = containerSize.y
  const cz = containerSize.z

  for (const [face, settings] of Object.entries(cutouts) as [
    'bottom' | 'front' | 'left' | 'back' | 'right',
    ResolvedCutout,
  ][]) {
    const insets = getFaceEdgeInsets(face, edges, radius)
    const border = settings.border

    const startInset = insets.start + border
    const endInset = insets.end + border
    const bottomInset = insets.bottom + border
    const topInset = insets.top + border

    if (face === 'bottom') {
      // Bottom: XY plane, depth=floor
      const w = cx - 2 * wall - startInset - endInset
      const h = cy - 2 * wall - bottomInset - topInset
      if (w <= 0 || h <= 0) continue

      placements.push({
        size: V([w, h, floor]),
        translation: V([wall + startInset, wall + bottomInset, 0]),
        rotation: V(),
        settings,
      })
    } else {
      // Side faces
      const geom = getSideFaceGeometry(face, cx, cy, cz, wall, floor)

      const w = geom.faceWidth - startInset - endInset
      const h = geom.faceHeight - bottomInset - topInset
      if (w <= 0 || h <= 0) continue

      // The cutout slab is created as (w, h, depth) in XY plane,
      // then rotated and translated to the correct wall position.
      const cutoutSize = face === 'front' || face === 'back' ? V([w, h, geom.depth]) : V([h, w, geom.depth])

      // Position within the face's local 2D system
      const localStart = startInset
      const localBottom = bottomInset

      const translation = computeSideTranslation(face, cx, cy, cz, wall, floor, geom, localStart, localBottom, w, h)

      placements.push({
        size: cutoutSize,
        translation,
        rotation: geom.rotation,
        settings,
      })
    }
  }

  return placements
}

type SideFaceGeometry = {
  /** Width of the inner wall area (along the face's width axis) */
  faceWidth: number
  /** Height of the inner wall area (always along Z, minus floor) */
  faceHeight: number
  /** Thickness of the wall to cut through */
  depth: number
  /** Rotation to bring XY slab onto this wall */
  rotation: Vector3
}

function getSideFaceGeometry(
  face: 'front' | 'left' | 'back' | 'right',
  cx: number,
  cy: number,
  cz: number,
  wall: number,
  floor: number,
): SideFaceGeometry {
  // All side faces have height = cz - floor (from floor top to container top)
  const faceHeight = cz - floor

  switch (face) {
    case 'front':
      return {
        faceWidth: cx - 2 * wall,
        faceHeight,
        depth: wall,
        // Rotate slab from XY plane to XZ plane (front wall at Y=0)
        rotation: V([Math.PI / 2, 0, 0]),
      }
    case 'back':
      return {
        faceWidth: cx - 2 * wall,
        faceHeight,
        depth: wall,
        rotation: V([Math.PI / 2, 0, 0]),
      }
    case 'left':
      return {
        faceWidth: cy - 2 * wall,
        faceHeight,
        depth: wall,
        rotation: V([0, -Math.PI / 2, 0]),
      }
    case 'right':
      return {
        faceWidth: cy - 2 * wall,
        faceHeight,
        depth: wall,
        rotation: V([0, -Math.PI / 2, 0]),
      }
  }
}

/**
 * Computes the global translation for a side cutout.
 *
 * The cutout slab is created at origin as (w, h, depth) then rotated.
 * We need to translate it so it lands on the correct wall position.
 *
 * The slab's local axes before rotation:
 * - local X = width along face
 * - local Y = height along face
 * - local Z = depth through wall
 *
 * After rotation the axes map to container global axes differently per face.
 */
function computeSideTranslation(
  face: 'front' | 'left' | 'back' | 'right',
  cx: number,
  cy: number,
  cz: number,
  wall: number,
  floor: number,
  geom: SideFaceGeometry,
  localStart: number,
  localBottom: number,
  w: number,
  h: number,
): Vector3 {
  // The cuboid primitive places itself at its own center-offset (size/2).
  // After rotation around origin, we translate the whole thing into place.
  //
  // Key insight: our cuboid is placed with origin at corner (0,0,0) extending to (w,h,depth).
  // Rotation happens around the rotation center (0 in our case).
  // So we need to figure out where the slab ends up after rotation and then
  // translate to the target position.

  switch (face) {
    case 'front':
      // Rotation: 90° around X. local(x,y,z) → global(x, -z, y)
      // Slab goes from local (0,0,0) to (w,h,depth)
      // After rot: (0, -depth, 0) to (w, 0, h)
      // We want it at: x=wall+localStart, y=0, z=floor+localBottom
      return V([wall + localStart, wall, floor + localBottom])
    case 'back':
      // Rotation: -90° around X. local(x,y,z) → global(x, z, -y)
      // After rot: (0, 0, -h) to (w, depth, 0)
      // We want it at: x=wall+localStart, y=cy-wall, z=floor+localBottom
      return V([wall + localStart, cy, floor + localBottom])
    case 'left':
      // Rotation: -90° around Y. local(x,y,z) → global(z, x, y) ... wait
      // -90° around Y: (x,y,z) → (-z, y, x)
      // After rot: (-depth, 0, 0) to (0, h, w)
      // We want it at: x=0, y=wall+localStart, z=floor+localBottom
      return V([wall, wall + localStart, floor + localBottom])
    case 'right':
      // Rotation: 90° around Y. local(x,y,z) → (z, y, -x)
      // After rot: (0, 0, -w) to (depth, h, 0)
      // We want it at: x=cx-wall, y=wall+localStart, z=floor+localBottom
      return V([cx, wall + localStart, floor + localBottom])
  }
}
