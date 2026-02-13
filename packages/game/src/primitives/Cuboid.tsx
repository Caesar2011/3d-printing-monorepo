import type { AxisRecordDefinition, Vector3 } from '@jsxcad/core'
import { V } from '@jsxcad/core'
import type { FC } from 'react'

import { Fillet } from './Fillet.js'
import { FilletCorner } from './FilletCorner.js'

/**
 * Bitmask enum for selecting which edges of a cuboid receive fillets.
 *
 * Layout (12 bits): `[TOP: F,L,B,R] [SIDE: FL,BL,BR,FR] [BOT: F,L,B,R]`
 */
export enum Edge {
  TOP = 0b1111_0000_0000,
  SIDE = 0b0000_1111_0000,
  BOT = 0b0000_0000_1111,
  FRONT = 0b1000_1001_1000,
  LEFT = 0b0100_1100_0100,
  BACK = 0b0010_0110_0010,
  RIGHT = 0b0001_0011_0001,
  ALL = 0b1111_1111_1111,
  NONE = 0b0000_0000_0000,
}

export const Cuboid: FC<{ size: AxisRecordDefinition; radius?: number; edges?: Edge }> = ({
  size,
  radius = 0,
  edges = Edge.ALL,
}) => {
  const dim = V(size)
  const cuboid = <cuboid size={size} />

  if (radius <= 0 || edges === Edge.NONE) return cuboid

  validateFilletParameters(radius, dim, edges)

  return (
    <subtract>
      {cuboid}
      <EdgesFillets radius={radius} dim={dim} edges={edges} />
      <CornerFillets radius={radius} dim={dim} edges={edges} />
    </subtract>
  )
}

// -- Edge fillet placement descriptors --

type EdgePlacement = {
  bit: number
  rotation: AxisRecordDefinition
  translation: (dim: Vector3) => AxisRecordDefinition
}

// Side vertical edges: FL, BL, BR, FR
const SIDE_EDGE_PLACEMENTS: EdgePlacement[] = [
  { bit: 0b0000_1000_0000, rotation: { z: 0 }, translation: () => ({}) },
  { bit: 0b0000_0100_0000, rotation: { z: -Math.PI / 2 }, translation: (d) => ({ y: d }) },
  { bit: 0b0000_0010_0000, rotation: { z: -Math.PI }, translation: (d) => ({ x: d, y: d }) },
  { bit: 0b0000_0001_0000, rotation: { z: (-3 * Math.PI) / 2 }, translation: (d) => ({ x: d }) },
]

// Top horizontal edges: front, left, back, right
const TOP_EDGE_PLACEMENTS: EdgePlacement[] = [
  { bit: 0b1000_0000_0000, rotation: { y: Math.PI / 2, z: 0 }, translation: (d) => ({ z: d }) },
  { bit: 0b0100_0000_0000, rotation: { y: Math.PI / 2, z: -Math.PI / 2 }, translation: (d) => ({ y: d, z: d }) },
  { bit: 0b0010_0000_0000, rotation: { y: Math.PI / 2, z: -Math.PI }, translation: (d) => ({ x: d, y: d, z: d }) },
  { bit: 0b0001_0000_0000, rotation: { y: Math.PI / 2, z: (-3 * Math.PI) / 2 }, translation: (d) => ({ x: d, z: d }) },
]

// Bottom horizontal edges: front, left, back, right
const BOT_EDGE_PLACEMENTS: EdgePlacement[] = [
  { bit: 0b0000_0000_1000, rotation: { y: -Math.PI / 2, z: 0 }, translation: () => ({}) },
  { bit: 0b0000_0000_0100, rotation: { y: -Math.PI / 2, z: -Math.PI / 2 }, translation: (d) => ({ y: d }) },
  { bit: 0b0000_0000_0010, rotation: { y: -Math.PI / 2, z: -Math.PI }, translation: (d) => ({ x: d, y: d }) },
  { bit: 0b0000_0000_0001, rotation: { y: -Math.PI / 2, z: (-3 * Math.PI) / 2 }, translation: (d) => ({ x: d }) },
]

const ALL_EDGE_PLACEMENTS = [...SIDE_EDGE_PLACEMENTS, ...TOP_EDGE_PLACEMENTS, ...BOT_EDGE_PLACEMENTS]

const EdgesFillets: FC<{ radius: number; dim: Vector3; edges: Edge }> = ({ radius, dim, edges }) => {
  const maxLength = Math.max(...dim.v)
  const activePlacements = ALL_EDGE_PLACEMENTS.filter(({ bit }) => (bit & edges) === bit)

  return (
    <>
      {activePlacements.map(({ bit, rotation, translation }) => (
        <translate by={translation(dim)} key={`edge-${bit}`}>
          <rotate by={rotation} center={0}>
            <Fillet size={{ xy: radius, z: maxLength }} />
          </rotate>
        </translate>
      ))}
    </>
  )
}

// -- Corner fillet placement descriptors --

type CornerPlacement = {
  /** Combined bitmask: all three edges meeting at this corner must be active */
  bits: number
  rotation: AxisRecordDefinition
  translation: (dim: Vector3) => AxisRecordDefinition
}

// Bottom corners: FL, BL, BR, FR
// Top corners: FL, BL, BR, FR
const CORNER_PLACEMENTS: CornerPlacement[] = [
  // Bottom corners
  { bits: 0b0000_1000_1100, rotation: { z: 0 }, translation: () => ({}) },
  { bits: 0b0000_0100_0110, rotation: { z: -Math.PI / 2 }, translation: (d) => ({ y: d }) },
  { bits: 0b0000_0010_0011, rotation: { z: -Math.PI }, translation: (d) => ({ x: d, y: d }) },
  { bits: 0b0000_0001_1001, rotation: { z: (-3 * Math.PI) / 2 }, translation: (d) => ({ x: d }) },
  // Top corners
  { bits: 0b1100_1000_0000, rotation: { y: Math.PI / 2, z: 0 }, translation: (d) => ({ z: d }) },
  { bits: 0b0110_0100_0000, rotation: { y: Math.PI / 2, z: -Math.PI / 2 }, translation: (d) => ({ y: d, z: d }) },
  { bits: 0b0011_0010_0000, rotation: { y: Math.PI / 2, z: -Math.PI }, translation: (d) => ({ x: d, y: d, z: d }) },
  { bits: 0b1001_0001_0000, rotation: { y: Math.PI / 2, z: (-3 * Math.PI) / 2 }, translation: (d) => ({ x: d, z: d }) },
]

const CornerFillets: FC<{ radius: number; dim: Vector3; edges: Edge }> = ({ radius, dim, edges }) => {
  const activeCorners = CORNER_PLACEMENTS.filter(({ bits }) => (bits & edges) === bits)

  return (
    <>
      {activeCorners.map(({ bits, rotation, translation }) => (
        <translate by={translation(dim)} key={`corner-${bits}`}>
          <rotate by={rotation} center={0}>
            <FilletCorner size={{ xyz: radius }} />
          </rotate>
        </translate>
      ))}
    </>
  )
}

function validateFilletParameters(radius: number, dim: Vector3, edges: Edge): void {
  if (radius < 0) {
    throw new RangeError('Fillet must be positive!')
  }
  if ((edges & (Edge.LEFT | Edge.RIGHT)) !== 0 && radius > dim.x)
    throw new RangeError(`Fillet (${radius}) must be smaller than shortest curved side x (${dim.x})!`)
  if ((edges & (Edge.FRONT | Edge.BACK)) !== 0 && radius > dim.y)
    throw new RangeError(`Fillet (${radius}) must be smaller than shortest curved side y (${dim.y})!`)
  if ((edges & (Edge.TOP | Edge.BOT)) !== 0 && radius > dim.z)
    throw new RangeError(`Fillet (${radius}) must be smaller than shortest curved side z (${dim.z})!`)
}
