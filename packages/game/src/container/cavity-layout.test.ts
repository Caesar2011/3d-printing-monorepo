import { describe, expect, test } from 'vitest'
import { V } from '@jsxcad/core'

import { computeCavityCells } from './cavity-layout.js'

const WALL = 1.5

describe('computeCavityCells', () => {
  test('no division returns single cell', () => {
    const origin = V([0, 0, 0])
    const size = V([80, 60, 40])
    const cells = computeCavityCells(origin, size, WALL)

    expect(cells).toHaveLength(1)
    expect(cells[0].offset.x).toBeCloseTo(0)
    expect(cells[0].offset.y).toBeCloseTo(0)
    expect(cells[0].size.x).toBeCloseTo(80)
    expect(cells[0].size.y).toBeCloseTo(60)
  })

  test('split x at 0.5 produces 2 equal cells', () => {
    const origin = V([0, 0, 0])
    const size = V([80, 60, 40])
    const cells = computeCavityCells(origin, size, WALL, { at: [0.5] })

    expect(cells).toHaveLength(2)
    const available = 80 - WALL
    expect(cells[0].size.x).toBeCloseTo(available / 2)
    expect(cells[1].size.x).toBeCloseTo(available / 2)
    expect(cells[0].size.y).toBeCloseTo(60)
    expect(cells[1].size.y).toBeCloseTo(60)
    expect(cells[1].offset.x).toBeCloseTo(available / 2 + WALL)
  })

  test('split x at 0.333, 0.666 produces 3 cells', () => {
    const origin = V([0, 0, 0])
    const size = V([90, 60, 40])
    const cells = computeCavityCells(origin, size, WALL, { at: [0.333, 0.666] })

    expect(cells).toHaveLength(3)
    const available = 90 - 2 * WALL
    expect(cells[0].size.x).toBeCloseTo(available * 0.333)
    expect(cells[1].size.x).toBeCloseTo(available * (0.666 - 0.333))
    expect(cells[2].size.x).toBeCloseTo(available * (1 - 0.666))
  })

  test('recursive: split x then y on first child', () => {
    const origin = V([0, 0, 0])
    const size = V([80, 60, 40])
    const cells = computeCavityCells(origin, size, WALL, {
      at: [0.5],
      children: [{ at: [0.5] }, null],
    })

    expect(cells).toHaveLength(3)
    expect(cells[0].size.x).toBeCloseTo(cells[1].size.x)
    expect(cells[2].size.y).toBeCloseTo(60)
  })

  test('deeply nested: x → y → x', () => {
    const origin = V([0, 0, 0])
    const size = V([100, 100, 40])
    const cells = computeCavityCells(origin, size, WALL, {
      at: [0.5],
      children: [
        {
          at: [0.5],
          children: [{ at: [0.5] }, null],
        },
        null,
      ],
    })

    expect(cells).toHaveLength(4)
  })

  describe('validation', () => {
    test('rejects division at 0', () => {
      expect(() => computeCavityCells(V([0, 0, 0]), V([80, 60, 40]), WALL, { at: [0] })).toThrow(
        'must be in (0, 1) exclusive',
      )
    })

    test('rejects division at 1', () => {
      expect(() => computeCavityCells(V([0, 0, 0]), V([80, 60, 40]), WALL, { at: [1] })).toThrow(
        'must be in (0, 1) exclusive',
      )
    })

    test('rejects negative division', () => {
      expect(() => computeCavityCells(V([0, 0, 0]), V([80, 60, 40]), WALL, { at: [-0.5] })).toThrow(
        'must be in (0, 1) exclusive',
      )
    })

    test('rejects duplicate positions', () => {
      expect(() => computeCavityCells(V([0, 0, 0]), V([80, 60, 40]), WALL, { at: [0.5, 0.5] })).toThrow(
        'Duplicate division position',
      )
    })

    test('rejects mismatched children length', () => {
      expect(() =>
        computeCavityCells(V([0, 0, 0]), V([80, 60, 40]), WALL, {
          at: [0.5],
          children: [null, null, null],
        }),
      ).toThrow('children length')
    })
  })
})
