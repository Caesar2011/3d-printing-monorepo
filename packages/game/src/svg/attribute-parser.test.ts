import { describe, expect, test } from 'vitest'

import { computePxPerMm, parseTransform, parseUnits, parseViewBox } from './attribute-parser.js'

describe('parseUnits', () => {
  test('returns 0 for undefined', () => {
    expect(parseUnits(undefined)).toBe(0)
  })

  test('returns 0 for non-numeric string', () => {
    expect(parseUnits('abc')).toBe(0)
  })

  test('parses mm values', () => {
    expect(parseUnits('10mm')).toBe(10)
  })

  test('parses cm values', () => {
    expect(parseUnits('2cm')).toBe(20)
  })

  test('parses in values', () => {
    expect(parseUnits('1in')).toBe(25.4)
  })

  test('parses pt values', () => {
    expect(parseUnits('72pt')).toBeCloseTo(25.4)
  })

  test('parses unitless values using pmm', () => {
    expect(parseUnits('100', 2)).toBe(50)
  })

  test('parses unitless with default pmm', () => {
    const result = parseUnits('354.3')
    expect(result).toBeCloseTo(354.3 / 3.54, 0)
  })
})

describe('parseViewBox', () => {
  test('returns undefined for undefined', () => {
    expect(parseViewBox(undefined)).toBeUndefined()
  })

  test('parses space-separated viewBox', () => {
    expect(parseViewBox('0 0 586 617')).toEqual({ minX: 0, minY: 0, width: 586, height: 617 })
  })

  test('parses comma-separated viewBox', () => {
    expect(parseViewBox('0,0,100,200')).toEqual({ minX: 0, minY: 0, width: 100, height: 200 })
  })

  test('returns undefined for incomplete viewBox', () => {
    expect(parseViewBox('0 0 100')).toBeUndefined()
  })

  test('returns undefined for invalid viewBox', () => {
    expect(parseViewBox('a b c d')).toBeUndefined()
  })
})

describe('computePxPerMm', () => {
  test('returns default when no viewBox', () => {
    const pmm = computePxPerMm('100', '100', undefined)
    expect(pmm).toBeCloseTo(90 / 25.4)
  })

  test('computes from width and viewBox', () => {
    const vb = { minX: 0, minY: 0, width: 586, height: 617 }
    const pmm = computePxPerMm('586', '617', vb)
    // 586 unitless → 586 / defaultPmm mm → viewBox.width / that
    expect(pmm).toBeCloseTo(90 / 25.4)
  })

  test('computes from mm width and viewBox', () => {
    const vb = { minX: 0, minY: 0, width: 1000, height: 500 }
    const pmm = computePxPerMm('100mm', '50mm', vb)
    expect(pmm).toBeCloseTo(10) // 1000 / 100
  })

  test('falls back to height if width missing', () => {
    const vb = { minX: 0, minY: 0, width: 1000, height: 500 }
    const pmm = computePxPerMm(undefined, '50mm', vb)
    expect(pmm).toBeCloseTo(10) // 500 / 50
  })
})

describe('parseTransform', () => {
  test('returns undefined for undefined', () => {
    expect(parseTransform(undefined)).toBeUndefined()
  })

  test('parses translate', () => {
    const m = parseTransform('translate(10, 20)')
    expect(m).toBeDefined()
    // mat4 translation: elements 12,13 for x,y
    expect(m![12]).toBeCloseTo(10)
    expect(m![13]).toBeCloseTo(20)
  })

  test('parses scale', () => {
    const m = parseTransform('scale(2, 3)')
    expect(m).toBeDefined()
    expect(m![0]).toBeCloseTo(2)
    expect(m![5]).toBeCloseTo(3)
  })

  test('parses uniform scale', () => {
    const m = parseTransform('scale(2)')
    expect(m).toBeDefined()
    expect(m![0]).toBeCloseTo(2)
    expect(m![5]).toBeCloseTo(2)
  })

  test('parses rotate', () => {
    const m = parseTransform('rotate(90)')
    expect(m).toBeDefined()
    expect(m![0]).toBeCloseTo(0, 5)
    expect(m![1]).toBeCloseTo(1, 5)
  })

  test('parses matrix', () => {
    const m = parseTransform('matrix(1, 0, 0, 1, 10, 20)')
    expect(m).toBeDefined()
    expect(m![12]).toBeCloseTo(10)
    expect(m![13]).toBeCloseTo(20)
  })

  test('composes multiple transforms', () => {
    const m = parseTransform('translate(10, 0) scale(2)')
    expect(m).toBeDefined()
    expect(m![0]).toBeCloseTo(2)
    expect(m![12]).toBeCloseTo(10)
  })
})
