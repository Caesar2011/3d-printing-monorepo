import jscad from '@jscad/modeling'
import { describe, expect, test } from 'vitest'

import { assembleEvenOdd, assembleNonZero, outlineContainsPoint } from './geometry-utils.js'
import type { Vec2 } from './types.js'

const square: Vec2[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
]

const innerSquare: Vec2[] = [
  [2, 2],
  [8, 2],
  [8, 8],
  [2, 8],
]

const disjointSquare: Vec2[] = [
  [20, 20],
  [30, 20],
  [30, 30],
  [20, 30],
]

describe('outlineContainsPoint', () => {
  test('point inside square', () => {
    expect(outlineContainsPoint(square, [5, 5])).toBe(true)
  })

  test('point outside square', () => {
    expect(outlineContainsPoint(square, [15, 5])).toBe(false)
  })

  test('point outside square (negative)', () => {
    expect(outlineContainsPoint(square, [-1, -1])).toBe(false)
  })

  test('point inside inner square', () => {
    expect(outlineContainsPoint(innerSquare, [5, 5])).toBe(true)
  })

  test('point inside outer but outside inner', () => {
    expect(outlineContainsPoint(innerSquare, [1, 1])).toBe(false)
  })

  test('point on edge is ambiguous (implementation-defined)', () => {
    // Just ensure it doesn't throw
    outlineContainsPoint(square, [0, 5])
  })

  test('triangle containment', () => {
    const triangle: Vec2[] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    expect(outlineContainsPoint(triangle, [5, 3])).toBe(true)
    expect(outlineContainsPoint(triangle, [0, 10])).toBe(false)
  })
})

describe('assembleEvenOdd', () => {
  test('returns undefined for empty outlines', () => {
    expect(assembleEvenOdd([])).toBeUndefined()
  })

  test('single outline produces a solid', () => {
    const result = assembleEvenOdd([square])
    expect(result).toBeDefined()
    const area = jscad.measurements.measureArea(result!)
    expect(Math.abs(area)).toBeCloseTo(100, 0)
  })

  test('outer + inner produces a shape with hole', () => {
    const result = assembleEvenOdd([square, innerSquare])
    expect(result).toBeDefined()
    const area = Math.abs(jscad.measurements.measureArea(result!))
    // 10*10 - 6*6 = 64
    expect(area).toBeCloseTo(64, 0)
  })

  test('two disjoint outlines both become solids', () => {
    const result = assembleEvenOdd([square, disjointSquare])
    expect(result).toBeDefined()
    const area = Math.abs(jscad.measurements.measureArea(result!))
    expect(area).toBeCloseTo(200, 0) // 100 + 100
  })

  test('three nested outlines: outer solid, middle hole, inner solid', () => {
    const outer: Vec2[] = [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ]
    const middle: Vec2[] = [
      [2, 2],
      [18, 2],
      [18, 18],
      [2, 18],
    ]
    const inner: Vec2[] = [
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
    ]

    const result = assembleEvenOdd([outer, middle, inner])
    expect(result).toBeDefined()
    // outer(400) - middle(256) + inner(100) = 244
    const area = Math.abs(jscad.measurements.measureArea(result!))
    expect(area).toBeCloseTo(244, 0)
  })
})

describe('assembleNonZero', () => {
  test('returns undefined for empty outlines', () => {
    expect(assembleNonZero([])).toBeUndefined()
  })

  test('single outline produces a solid', () => {
    const result = assembleNonZero([square])
    expect(result).toBeDefined()
    const area = jscad.measurements.measureArea(result!)
    expect(Math.abs(area)).toBeCloseTo(100, 0)
  })

  test('outer + clockwise inner produces hole', () => {
    // Counter-clockwise outer
    const ccwOuter: Vec2[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]
    // Clockwise inner (reversed winding)
    const cwInner: Vec2[] = [
      [2, 2],
      [2, 8],
      [8, 8],
      [8, 2],
    ]

    const result = assembleNonZero([ccwOuter, cwInner])
    expect(result).toBeDefined()
  })

  test('two disjoint outlines both become solids', () => {
    const result = assembleNonZero([square, disjointSquare])
    expect(result).toBeDefined()
    const area = Math.abs(jscad.measurements.measureArea(result!))
    expect(area).toBeCloseTo(200, 0)
  })
})
