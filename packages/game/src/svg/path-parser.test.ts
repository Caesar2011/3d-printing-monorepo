import { describe, expect, test } from 'vitest'

import { parsePath } from './path-parser.js'

describe('parsePath', () => {
  test('returns empty array for empty string', () => {
    expect(parsePath('', 32)).toEqual([])
  })

  test('parses simple triangle (M, L, Z)', () => {
    const outlines = parsePath('M 0 0 L 10 0 L 10 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0]).toHaveLength(4) // M point + 2 L points + Z return
    expect(outlines[0][0]).toEqual([0, 0])
    expect(outlines[0][1]).toEqual([10, 0])
    expect(outlines[0][2]).toEqual([10, 10])
    expect(outlines[0][3]).toEqual([0, 0]) // Z closes back to start
  })

  test('parses relative line commands (m, l)', () => {
    const outlines = parsePath('m 0 0 l 10 0 l 0 10 z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][0]).toEqual([0, 0])
    expect(outlines[0][1]).toEqual([10, 0])
    expect(outlines[0][2]).toEqual([10, 10])
  })

  test('parses H and V commands', () => {
    const outlines = parsePath('M 0 0 H 10 V 10 H 0 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][0]).toEqual([0, 0])
    expect(outlines[0][1]).toEqual([10, 0])
    expect(outlines[0][2]).toEqual([10, 10])
    expect(outlines[0][3]).toEqual([0, 10])
  })

  test('parses relative h and v commands', () => {
    const outlines = parsePath('M 5 5 h 10 v 10 h -10 z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][1]).toEqual([15, 5])
    expect(outlines[0][2]).toEqual([15, 15])
    expect(outlines[0][3]).toEqual([5, 15])
  })

  test('parses cubic bezier (C)', () => {
    const outlines = parsePath('M 0 0 C 10 0, 10 10, 0 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2) // has interpolated points
    expect(outlines[0][0]).toEqual([0, 0])
    // last point before Z close should be near the endpoint
    const lastBeforeClose = outlines[0][outlines[0].length - 2]
    expect(lastBeforeClose[0]).toBeCloseTo(0, 1)
    expect(lastBeforeClose[1]).toBeCloseTo(10, 1)
  })

  test('parses relative cubic bezier (c)', () => {
    const outlines = parsePath('M 0 0 c 10 0, 10 10, 0 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2)
  })

  test('parses smooth cubic (S)', () => {
    const outlines = parsePath('M 0 0 C 5 0, 10 5, 10 10 S 15 20, 20 20 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(3)
  })

  test('parses quadratic bezier (Q)', () => {
    const outlines = parsePath('M 0 0 Q 10 0, 10 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2)
  })

  test('parses smooth quadratic (T)', () => {
    const outlines = parsePath('M 0 0 Q 5 0, 10 5 T 20 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(3)
  })

  test('parses arc (A)', () => {
    const outlines = parsePath('M 0 0 A 10 10 0 0 1 20 0 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2)
  })

  test('parses relative arc (a)', () => {
    const outlines = parsePath('M 0 0 a 10 10 0 0 1 20 0 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2)
  })

  test('parses multiple subpaths', () => {
    const outlines = parsePath('M 0 0 L 10 0 L 10 10 Z M 20 20 L 30 20 L 30 30 Z', 32)
    expect(outlines).toHaveLength(2)
    expect(outlines[0][0]).toEqual([0, 0])
    expect(outlines[1][0]).toEqual([20, 20])
  })

  test('handles implicit L after M', () => {
    // After M, additional coordinate pairs are treated as L
    const outlines = parsePath('M 0 0 10 0 10 10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0]).toHaveLength(4)
    expect(outlines[0][1]).toEqual([10, 0])
    expect(outlines[0][2]).toEqual([10, 10])
  })

  test('handles comma-separated coordinates', () => {
    const outlines = parsePath('M 0,0 L 10,0 L 10,10 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][1]).toEqual([10, 0])
  })

  test('handles coordinates without spaces (minus as separator)', () => {
    const outlines = parsePath('M0 0L10 0L10 10Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][1]).toEqual([10, 0])
  })

  test('handles repeated L coordinates', () => {
    const outlines = parsePath('M 0 0 L 10 0 20 0 30 0 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0]).toHaveLength(5) // M + 3 implicit L + Z
    expect(outlines[0][3]).toEqual([30, 0])
  })

  test('unclosed subpath is still captured', () => {
    const outlines = parsePath('M 0 0 L 10 0 L 10 10', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0]).toHaveLength(3)
  })

  test('multiple unclosed subpaths', () => {
    const outlines = parsePath('M 0 0 L 10 0 M 20 20 L 30 20', 32)
    expect(outlines).toHaveLength(2)
  })

  test('parses path with decimal coordinates', () => {
    const outlines = parsePath('M 255.500 0.980 L 246.500 1.936 L 239.500 2.013 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][0][0]).toBeCloseTo(255.5)
    expect(outlines[0][0][1]).toBeCloseTo(0.98)
  })

  test('parses cubic bezier with comma separators (SVG style)', () => {
    const outlines = parsePath('M 255.500 0.980 C 254.400 1.464, 250.350 1.894, 246.500 1.936 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0].length).toBeGreaterThan(2)
  })

  test('parses complex multi-subpath with C commands', () => {
    // Simplified version of the energy1 SVG structure
    const d = [
      'M 255 1 C 254 1, 250 2, 246 2 L 239 2 L 236 4 Z',
      'M 266 34 C 266 35, 264 36, 263 37 L 258 38 Z',
      'M 337 38 L 336 40 L 329 41 Z',
    ].join(' ')
    const outlines = parsePath(d, 32)
    expect(outlines).toHaveLength(3)
  })

  test('handles negative coordinates', () => {
    const outlines = parsePath('M -10 -20 L 10 -20 L 10 20 L -10 20 Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0][0]).toEqual([-10, -20])
  })

  test('handles numbers immediately after command letters', () => {
    const outlines = parsePath('M0 0L10 0L10 10L0 10Z', 32)
    expect(outlines).toHaveLength(1)
    expect(outlines[0]).toHaveLength(5)
  })
})
