import { describe, expect, test } from 'vitest'
import { V } from '@jsxcad/core'

import type { CavityCell } from './cavity-layout.js'
import { determineScoopAxis, computeScoopWidth, validateScoopFit } from './scoop-geometry.js'

describe('determineScoopAxis', () => {
  test('returns x when x is longer', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([80, 60, 40]) }
    expect(determineScoopAxis(cell)).toBe('x')
  })

  test('returns y when y is longer', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([40, 60, 30]) }
    expect(determineScoopAxis(cell)).toBe('y')
  })

  test('returns x when square (deterministic default)', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([50, 50, 30]) }
    expect(determineScoopAxis(cell)).toBe('x')
  })
})

describe('computeScoopWidth', () => {
  test('divides height by factor', () => {
    expect(computeScoopWidth(40, 1.3)).toBeCloseTo(40 / 1.3)
  })

  test('factor of 2 gives half height', () => {
    expect(computeScoopWidth(40, 2)).toBeCloseTo(20)
  })
})

describe('validateScoopFit', () => {
  test('passes when long side is large enough', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([80, 40, 30]) }
    const scoopWidth = computeScoopWidth(30, 1.3)
    expect(() => validateScoopFit(cell, scoopWidth)).not.toThrow()
  })

  test('throws when long side is too short for two scoops', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([20, 10, 30]) }
    const scoopWidth = computeScoopWidth(30, 1.3) // ~23.08, needs 46.15
    expect(() => validateScoopFit(cell, scoopWidth)).toThrow(RangeError)
  })

  test('throws with exact message mentioning the axis', () => {
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([10, 20, 30]) }
    const scoopWidth = computeScoopWidth(30, 1.3)
    expect(() => validateScoopFit(cell, scoopWidth)).toThrow(/y-axis/)
  })

  test('passes when exactly fitting (boundary)', () => {
    const height = 30
    const scoopWidth = computeScoopWidth(height, 1.3)
    const longSide = 2 * scoopWidth
    const cell: CavityCell = { offset: V([0, 0, 0]), size: V([longSide, 10, height]) }
    expect(() => validateScoopFit(cell, scoopWidth)).not.toThrow()
  })
})
