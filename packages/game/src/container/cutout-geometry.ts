import { V, type Vector3 } from '@jsxcad/core'

import type { Edge } from '../primitives/Cuboid.js'

import type { CutoutSettings, FaceName, SideFaceName } from './types.js'
import type { CavityCell } from './cavity-layout.js'

export type ResolvedCutout = Required<CutoutSettings>
export type FaceCutoutMap = Partial<Record<FaceName, ResolvedCutout>>

export type CutoutPlacement = {
  size: Vector3
  translation: Vector3
  rotation: Vector3
  settings: ResolvedCutout
}

const EPSILON = 0.01

// --- Edge bit constants ---

const SIDE_FL = 0b0000_1000_0000
const SIDE_BL = 0b0000_0100_0000
const SIDE_BR = 0b0000_0010_0000
const SIDE_FR = 0b0000_0001_0000

const BOT_FRONT = 0b0000_0000_1000
const BOT_LEFT = 0b0000_0000_0100
const BOT_BACK = 0b0000_0000_0010
const BOT_RIGHT = 0b0000_0000_0001

const TOP_FRONT = 0b1000_0000_0000
const TOP_LEFT = 0b0100_0000_0000
const TOP_BACK = 0b0010_0000_0000
const TOP_RIGHT = 0b0001_0000_0000

function has(edges: Edge, bit: number): boolean {
  return (edges & bit) !== 0
}

type FaceEdgeInsets = { start: number; end: number; bottom: number; top: number }

function getFaceEdgeInsets(face: FaceName, edges: Edge, radius: number): FaceEdgeInsets {
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

// --- Face descriptor table (eliminates switch duplication) ---

type SideFaceDescriptor = {
  /** Extracts the face width from the cell size */
  faceWidth: (cell: CavityCell) => number
  /** Which outer edge the "start" side aligns to */
  isAtStart: (cell: CavityCell, containerSize: Vector3, wall: number) => boolean
  /** Which outer edge the "end" side aligns to */
  isAtEnd: (cell: CavityCell, containerSize: Vector3, wall: number) => boolean
  /** Is the cell at the bottom of the container */
  rotation: Vector3
  /** Build the cutout slab size from (width, height, depth) */
  buildSize: (w: number, h: number, depth: number) => Vector3
  /** Compute translation given cell, container, wall, localStart, localBottom */
  translate: (cell: CavityCell, cs: Vector3, wall: number, ls: number, lb: number) => Vector3
}

const SIDE_FACE_DESCRIPTORS: Record<SideFaceName, SideFaceDescriptor> = {
  front: {
    faceWidth: (cell) => cell.size.x,
    isAtStart: (cell, _, wall) => Math.abs(cell.offset.x - wall) < EPSILON,
    isAtEnd: (cell, cs, wall) => Math.abs(cell.offset.x + cell.size.x - (cs.x - wall)) < EPSILON,
    rotation: V([Math.PI / 2, 0, 0]),
    buildSize: (w, h, d) => V([w, h, d]),
    translate: (cell, _, wall, ls, lb) => V([cell.offset.x + ls, wall, cell.offset.z + lb]),
  },
  back: {
    faceWidth: (cell) => cell.size.x,
    isAtStart: (cell, cs, wall) => Math.abs(cell.offset.x + cell.size.x - (cs.x - wall)) < EPSILON,
    isAtEnd: (cell, _, wall) => Math.abs(cell.offset.x - wall) < EPSILON,
    rotation: V([Math.PI / 2, 0, 0]),
    buildSize: (w, h, d) => V([w, h, d]),
    translate: (cell, cs, _, ls, lb) => V([cell.offset.x + ls, cs.y, cell.offset.z + lb]),
  },
  left: {
    faceWidth: (cell) => cell.size.y,
    isAtStart: (cell, _, wall) => Math.abs(cell.offset.y - wall) < EPSILON,
    isAtEnd: (cell, cs, wall) => Math.abs(cell.offset.y + cell.size.y - (cs.y - wall)) < EPSILON,
    rotation: V([0, -Math.PI / 2, 0]),
    buildSize: (w, h, d) => V([h, w, d]),
    translate: (cell, _, wall, ls, lb) => V([wall, cell.offset.y + ls, cell.offset.z + lb]),
  },
  right: {
    faceWidth: (cell) => cell.size.y,
    isAtStart: (cell, _, wall) => Math.abs(cell.offset.y - wall) < EPSILON,
    isAtEnd: (cell, cs, wall) => Math.abs(cell.offset.y + cell.size.y - (cs.y - wall)) < EPSILON,
    rotation: V([0, -Math.PI / 2, 0]),
    buildSize: (w, h, d) => V([h, w, d]),
    translate: (cell, cs, _, ls, lb) => V([cs.x, cell.offset.y + ls, cell.offset.z + lb]),
  },
}

// --- Outer-face detection ---

function getCellOuterFaces(cell: CavityCell, containerSize: Vector3, wall: number, floor: number): Set<FaceName> {
  const faces = new Set<FaceName>()

  if (Math.abs(cell.offset.x - wall) < EPSILON) faces.add('left')
  if (Math.abs(cell.offset.x + cell.size.x - (containerSize.x - wall)) < EPSILON) faces.add('right')
  if (Math.abs(cell.offset.y - wall) < EPSILON) faces.add('front')
  if (Math.abs(cell.offset.y + cell.size.y - (containerSize.y - wall)) < EPSILON) faces.add('back')
  if (Math.abs(cell.offset.z - floor) < EPSILON) faces.add('bottom')

  return faces
}

// --- Main placement logic ---

/** Computes cutout placements for a single cavity cell against outer container walls. */
export function computeCellCutoutPlacements(
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  cutouts: FaceCutoutMap,
): CutoutPlacement[] {
  const placements: CutoutPlacement[] = []
  const outerFaces = getCellOuterFaces(cell, containerSize, wall, floor)

  for (const [face, settings] of Object.entries(cutouts) as [FaceName, ResolvedCutout][]) {
    if (!outerFaces.has(face)) continue

    const border = settings.border

    if (face === 'bottom') {
      const placement = computeBottomCellCutout(cell, containerSize, wall, floor, edges, radius, settings, border)
      if (placement) placements.push(placement)
    } else {
      const placement = computeSideCellCutout(face, cell, containerSize, wall, floor, radius, edges, settings, border)
      if (placement) placements.push(placement)
    }
  }

  return placements
}

function computeBottomCellCutout(
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  edges: Edge,
  radius: number,
  settings: ResolvedCutout,
  border: number,
): CutoutPlacement | null {
  const baseInsets = getFaceEdgeInsets('bottom', edges, radius)
  const insets: FaceEdgeInsets = {
    start: Math.abs(cell.offset.x - wall) < EPSILON ? baseInsets.start : 0,
    end: Math.abs(cell.offset.x + cell.size.x - (containerSize.x - wall)) < EPSILON ? baseInsets.end : 0,
    bottom: Math.abs(cell.offset.y - wall) < EPSILON ? baseInsets.bottom : 0,
    top: Math.abs(cell.offset.y + cell.size.y - (containerSize.y - wall)) < EPSILON ? baseInsets.top : 0,
  }

  const w = cell.size.x - insets.start - insets.end - 2 * border
  const h = cell.size.y - insets.bottom - insets.top - 2 * border
  if (w <= 0 || h <= 0) return null

  return {
    size: V([w, h, floor]),
    translation: V([cell.offset.x + insets.start + border, cell.offset.y + insets.bottom + border, 0]),
    rotation: V(),
    settings,
  }
}

function computeSideCellCutout(
  face: SideFaceName,
  cell: CavityCell,
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  settings: ResolvedCutout,
  border: number,
): CutoutPlacement | null {
  const desc = SIDE_FACE_DESCRIPTORS[face]
  const insets = getFaceEdgeInsets(face, edges, radius)

  const isAtStart = desc.isAtStart(cell, containerSize, wall)
  const isAtEnd = desc.isAtEnd(cell, containerSize, wall)
  const isAtBottom = Math.abs(cell.offset.z - floor) < EPSILON

  const startInset = isAtStart ? insets.start : 0
  const endInset = isAtEnd ? insets.end : 0
  const bottomInset = isAtBottom ? insets.bottom : 0
  // Only apply top inset if the container actually has a top edge on this face
  const topInset = insets.top

  const faceWidth = desc.faceWidth(cell)
  const faceHeight = cell.size.z

  const w = faceWidth - startInset - endInset - 2 * border
  const h = faceHeight - bottomInset - topInset - 2 * border
  if (w <= 0 || h <= 0) return null

  const localStart = startInset + border
  const localBottom = bottomInset + border

  return {
    size: desc.buildSize(w, h, wall),
    translation: desc.translate(cell, containerSize, wall, localStart, localBottom),
    rotation: desc.rotation,
    settings,
  }
}

/** Convenience wrapper for undivided containers. */
export function computeCutoutPlacements(
  containerSize: Vector3,
  wall: number,
  floor: number,
  radius: number,
  edges: Edge,
  cutouts: FaceCutoutMap,
): CutoutPlacement[] {
  const cell: CavityCell = {
    offset: V([wall, wall, floor]),
    size: V([containerSize.x - 2 * wall, containerSize.y - 2 * wall, containerSize.z - floor]),
  }
  return computeCellCutoutPlacements(cell, containerSize, wall, floor, radius, edges, cutouts)
}
