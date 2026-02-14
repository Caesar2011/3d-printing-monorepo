import type { AxisRecordDefinition, Vector3 } from '@jsxcad/core'
import { V } from '@jsxcad/core'
import type { FC } from 'react'

import { Fillet } from './Fillet.js'
import { FilletCorner } from './FilletCorner.js'

export enum Edge {
  // 1st top: front, left, back, right
  // 2nd side: front-left, back-left, back-right, front-right
  // 3rd bot: front, left, back, right
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

  // No filleting? Return the base cuboid.
  if (radius <= 0 || edges === Edge.NONE) return cuboid

  // Validate the fillet parameters
  validateFilletParameters(radius, dim, edges)

  return (
    <subtract>
      {cuboid}
      <EdgesFillets radius={radius} dim={dim} edges={edges} />
      <CornerFillets radius={radius} dim={dim} edges={edges} />
    </subtract>
  )
}

const EdgesFillets: FC<{ radius: number; dim: Vector3; edges: Edge }> = ({ radius, dim, edges }) => {
  const sides: [AxisRecordDefinition, AxisRecordDefinition][] = [
    0b0000_1000_0000, 0b0000_0100_0000, 0b0000_0010_0000, 0b0000_0001_0000,
  ]
    .map((edge, idx) => [edge, idx] as const)
    .filter(([edge]) => (edge & edges) === edge)
    .map(([edge, idx]) => [
      { z: (-Math.PI / 2) * idx },
      { x: edge & Edge.RIGHT ? dim : 0, y: edge & Edge.BACK ? dim : 0 },
    ])
  const tops: [AxisRecordDefinition, AxisRecordDefinition][] = [
    0b1000_0000_0000, 0b0100_0000_0000, 0b0010_0000_0000, 0b0001_0000_0000,
  ]
    .map((edge, idx) => [edge, idx] as const)
    .filter(([edge]) => (edge & edges) === edge)
    .map(([edge, idx]) => [
      { y: Math.PI / 2, z: (-Math.PI / 2) * idx },
      { x: edge & (Edge.BACK | Edge.RIGHT) ? dim : 0, y: edge & (Edge.LEFT | Edge.BACK) ? dim : 0, z: dim },
    ])
  const bottoms: [AxisRecordDefinition, AxisRecordDefinition][] = [
    0b0000_0000_1000, 0b0000_0000_0100, 0b0000_0000_0010, 0b0000_0000_0001,
  ]
    .map((edge, idx) => [edge, idx] as const)
    .filter(([edge]) => (edge & edges) === edge)
    .map(([edge, idx]) => [
      { y: -Math.PI / 2, z: (-Math.PI / 2) * idx },
      { x: edge & (Edge.FRONT | Edge.RIGHT) ? dim : 0, y: edge & (Edge.RIGHT | Edge.BACK) ? dim : 0 },
    ])

  const maxLength = Math.max(...dim.v)

  return (
    <>
      {[...sides, ...tops, ...bottoms].map(([rotation, translation], idx) => (
        <translate by={translation} key={idx}>
          <rotate by={rotation} center={0}>
            <Fillet size={{ xy: radius, z: maxLength }} />
          </rotate>
        </translate>
      ))}
    </>
  )
}

const CornerFillets: FC<{ radius: number; dim: Vector3; edges: Edge }> = ({ radius, dim, edges }) => {
  const bottoms: [AxisRecordDefinition, AxisRecordDefinition, number][] = [
    0b0000_1000_1100, 0b0000_0100_0110, 0b0000_0010_0011, 0b0000_0001_1001, 0b1100_1000_0000, 0b0110_0100_0000,
    0b0011_0010_0000, 0b1001_0001_0000,
  ]
    .map((corner, idx) => [corner, idx] as const)
    .filter(([corner]) => (corner & edges) === corner)
    .map(([corner, idx]) => [
      { y: corner & Edge.TOP ? Math.PI / 2 : 0, z: (-Math.PI / 2) * idx },
      { x: corner & Edge.RIGHT ? dim : 0, y: corner & Edge.BACK ? dim : 0, z: corner & Edge.TOP ? dim : 0 },
      idx,
    ])

  return (
    <>
      {[...bottoms].map(([rotation, translation, idx]) => (
        <translate by={translation} key={idx}>
          <rotate by={rotation} center={0}>
            <FilletCorner size={{ xyz: radius }} />
          </rotate>
        </translate>
      ))}
    </>
  )
}

/** Validate that the radius is positive and small enough for the given dimensions */
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
