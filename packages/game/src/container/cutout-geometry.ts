import { V, type Vector3 } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings } from './types.js'
import type { CavityCell } from './cavity-layout.js'

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

// Side edges (vertical) are bits 4-7
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

type FaceEdgeInsets = {
  start: number
  end: number
  bottom: number
  top: number
}

function getFaceEdgeInsets(
  face: 'bottom' | 'front' | 'left' | 'back' | 'right',
  edges: Edge,
  radius: number,
): FaceEdgeInsets {
  switch (face) {
    case 'bottom':
      return {
        start: has(edges, BOT_LEFT) ? radius : 0,
        end: has(edges, BOT_RIGHT) ? radius : 0,
        bottom: has(edges, BOT_FRONT) ? radius : 0,
        top: has(edges, BOT_BACK) ? radius : 0,
      }
    case 'front':
      return {
        start: has(edges, SIDE_FL) ? radius : 0,
        end: has(edges, SIDE_FR) ? radius : 0,
        bottom: has(edges, BOT_FRONT) ? radius : 0,
        top: has(edges, TOP_FRONT) ? radius : 0,
      }
    case 'back':
      return {
        start: has(edges, SIDE_BR) ? radius : 0,
        end: has(edges, SIDE_BL) ? radius : 0,
        bottom: has(edges, BOT_BACK) ? radius : 0,
        top: has(edges, TOP_BACK) ? radius : 0,
      }
    case 'left':
      return {
        start: has(edges, SIDE_FL) ? radius : 0,
        end: has(edges, SIDE_BL) ? radius : 0,
        bottom: has(edges, BOT_LEFT) ? radius : 0,
        top: has(edges, TOP_LEFT) ? radius : 0,
      }
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
 * Determines which outer faces of the container a cavity cell touches.
 * Only faces that are flush with the container wall get cutouts.
 */
function getCellOuterFaces(
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  epsilon = 0.01,
): Set<'bottom' | 'front' | 'left' | 'back' | 'right'> {
  const faces = new Set<'bottom' | 'front' | 'left' | 'back' | 'right'>()
  const cx = containerSize.x
  const cy = containerSize.y

  if (Math.abs(cell.offset.x - wall) < epsilon) faces.add('left')
  if (Math.abs(cell.offset.x + cell.size.x - (cx - wall)) < epsilon) faces.add('right')
  if (Math.abs(cell.offset.y - wall) < epsilon) faces.add('front')
  if (Math.abs(cell.offset.y + cell.size.y - (cy - wall)) < epsilon) faces.add('back')
  // Bottom is always possible for cells at floor level
  if (Math.abs(cell.offset.z - floor) < epsilon) faces.add('bottom')

  return faces
}

/**
 * Computes cutout placements for a single cavity cell.
 * Only produces cutouts for faces that are on the outer container wall.
 */
export function computeCellCutoutPlacements(
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  cutouts: Partial<Record<'bottom' | 'front' | 'left' | 'back' | 'right', ResolvedCutout>>,
): CutoutPlacement[] {
  const placements: CutoutPlacement[] = []
  const outerFaces = getCellOuterFaces(cell, containerSize, wall, floor)

  for (const [face, settings] of Object.entries(cutouts) as [
    'bottom' | 'front' | 'left' | 'back' | 'right',
    ResolvedCutout,
  ][]) {
    // Only cut faces where this cell is against the outer wall
    if (!outerFaces.has(face)) continue

    const border = settings.border

    if (face === 'bottom') {
      const insets = getBottomCellInsets(cell, containerSize, wall, edges, radius)
      const w = cell.size.x - insets.start - insets.end - 2 * border
      const h = cell.size.y - insets.bottom - insets.top - 2 * border
      if (w <= 0 || h <= 0) continue

      placements.push({
        size: V([w, h, floor]),
        translation: V([cell.offset.x + insets.start + border, cell.offset.y + insets.bottom + border, 0]),
        rotation: V(),
        settings,
      })
    } else {
      const placement = computeSideCellCutout(face, cell, containerSize, wall, floor, radius, edges, settings, border)
      if (placement) placements.push(placement)
    }
  }

  return placements
}

function getBottomCellInsets(
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  edges: Edge,
  radius: number,
  epsilon = 0.01,
): FaceEdgeInsets {
  const baseInsets = getFaceEdgeInsets('bottom', edges, radius)
  // Only apply corner insets when the cell is at the corresponding outer corner
  return {
    start: Math.abs(cell.offset.x - wall) < epsilon ? baseInsets.start : 0,
    end: Math.abs(cell.offset.x + cell.size.x - (containerSize.x - wall)) < epsilon ? baseInsets.end : 0,
    bottom: Math.abs(cell.offset.y - wall) < epsilon ? baseInsets.bottom : 0,
    top: Math.abs(cell.offset.y + cell.size.y - (containerSize.y - wall)) < epsilon ? baseInsets.top : 0,
  }
}

function computeSideCellCutout(
  face: 'front' | 'left' | 'back' | 'right',
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  settings: ResolvedCutout,
  border: number,
): CutoutPlacement | null {
  const cx = containerSize.x
  const cy = containerSize.y
  const epsilon = 0.01

  const insets = getFaceEdgeInsets(face, edges, radius)

  // Cell-relative face dimensions and whether corner insets apply
  let faceWidth: number
  let faceHeight: number
  let startInset: number
  let endInset: number
  let bottomInset: number
  let topInset: number

  const cellHeight = cell.size.z
  const isAtBottom = Math.abs(cell.offset.z - floor) < epsilon

  switch (face) {
    case 'front': {
      faceWidth = cell.size.x
      faceHeight = cellHeight
      const isAtLeft = Math.abs(cell.offset.x - wall) < epsilon
      const isAtRight = Math.abs(cell.offset.x + cell.size.x - (cx - wall)) < epsilon
      startInset = isAtLeft ? insets.start : 0
      endInset = isAtRight ? insets.end : 0
      bottomInset = isAtBottom ? insets.bottom : 0
      topInset = insets.top // top is open
      break
    }
    case 'back': {
      faceWidth = cell.size.x
      faceHeight = cellHeight
      const isAtRight = Math.abs(cell.offset.x + cell.size.x - (cx - wall)) < epsilon
      const isAtLeft = Math.abs(cell.offset.x - wall) < epsilon
      startInset = isAtRight ? insets.start : 0
      endInset = isAtLeft ? insets.end : 0
      bottomInset = isAtBottom ? insets.bottom : 0
      topInset = insets.top
      break
    }
    case 'left': {
      faceWidth = cell.size.y
      faceHeight = cellHeight
      const isAtFront = Math.abs(cell.offset.y - wall) < epsilon
      const isAtBack = Math.abs(cell.offset.y + cell.size.y - (cy - wall)) < epsilon
      startInset = isAtFront ? insets.start : 0
      endInset = isAtBack ? insets.end : 0
      bottomInset = isAtBottom ? insets.bottom : 0
      topInset = insets.top
      break
    }
    case 'right': {
      faceWidth = cell.size.y
      faceHeight = cellHeight
      const isAtFront = Math.abs(cell.offset.y - wall) < epsilon
      const isAtBack = Math.abs(cell.offset.y + cell.size.y - (cy - wall)) < epsilon
      startInset = isAtFront ? insets.start : 0
      endInset = isAtBack ? insets.end : 0
      bottomInset = isAtBottom ? insets.bottom : 0
      topInset = insets.top
      break
    }
  }

  const w = faceWidth - startInset - endInset - 2 * border
  const h = faceHeight - bottomInset - topInset - 2 * border
  if (w <= 0 || h <= 0) return null

  const depth = wall

  const cutoutSize = face === 'front' || face === 'back' ? V([w, h, depth]) : V([h, w, depth])

  const localStart = startInset + border
  const localBottom = bottomInset + border

  const translation = computeSideCellTranslation(face, cell, containerSize, wall, localStart, localBottom)
  const rotation = getSideRotation(face)

  return { size: cutoutSize, translation, rotation, settings }
}

function getSideRotation(face: 'front' | 'left' | 'back' | 'right'): Vector3 {
  switch (face) {
    case 'front':
      return V([Math.PI / 2, 0, 0])
    case 'back':
      return V([Math.PI / 2, 0, 0])
    case 'left':
      return V([0, -Math.PI / 2, 0])
    case 'right':
      return V([0, -Math.PI / 2, 0])
  }
}

function computeSideCellTranslation(
  face: 'front' | 'left' | 'back' | 'right',
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  localStart: number,
  localBottom: number,
): Vector3 {
  const cx = containerSize.x
  const cy = containerSize.y

  switch (face) {
    case 'front':
      return V([cell.offset.x + localStart, wall, cell.offset.z + localBottom])
    case 'back':
      return V([cell.offset.x + localStart, cy, cell.offset.z + localBottom])
    case 'left':
      return V([wall, cell.offset.y + localStart, cell.offset.z + localBottom])
    case 'right':
      return V([cx, cell.offset.y + localStart, cell.offset.z + localBottom])
  }
}

/**
 * Legacy entry point: computes cutout placements for a single full container (no divisions).
 */
export function computeCutoutPlacements(
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  cutouts: Partial<Record<'bottom' | 'front' | 'left' | 'back' | 'right', ResolvedCutout>>,
): CutoutPlacement[] {
  const innerOrigin = V([wall, wall, floor])
  const innerSize = V([containerSize.x - 2 * wall, containerSize.y - 2 * wall, containerSize.z - floor])

  const cell: CavityCell = { offset: innerOrigin, size: innerSize }
  return computeCellCutoutPlacements(cell, containerSize, wall, floor, radius, edges, cutouts)
}
