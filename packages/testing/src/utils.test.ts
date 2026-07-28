import { describe, expect, it } from 'vitest'

import { computeCandidateAngles, fitsShapeOnBed, getShapePairs, isLidOrPart } from './utils.js'

describe('isLidOrPart', () => {
  it('matches names containing "part"', () => {
    expect(isLidOrPart({ name: 'bigTokenMain-Part' })).toBe(true)
  })

  it('matches names containing "lid"', () => {
    expect(isLidOrPart({ name: 'bigTokenMain-Lid' })).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isLidOrPart({ name: 'PART-01' })).toBe(true)
    expect(isLidOrPart({ name: 'LID-CAP' })).toBe(true)
    expect(isLidOrPart({ name: 'bigtokenmain-part' })).toBe(true)
  })

  it('rejects names without part or lid', () => {
    expect(isLidOrPart({ name: 'bigTokenMain-raft' })).toBe(false)
    expect(isLidOrPart({ name: 'bigTokenMain-torch' })).toBe(false)
    expect(isLidOrPart({ name: 'bigTokenMain-spikes' })).toBe(false)
  })

  it('rejects empty name', () => {
    expect(isLidOrPart({ name: '' })).toBe(false)
  })

  it('matches partial substrings', () => {
    expect(isLidOrPart({ name: 'partition-wall' })).toBe(true)
    expect(isLidOrPart({ name: 'candlestick-lid' })).toBe(true)
  })
})

describe('computeCandidateAngles', () => {
  it('returns only [0, π/2] for small shapes within diagonal limits', () => {
    const angles = computeCandidateAngles(100, 100, 256, 256)
    expect(angles).toHaveLength(2)
    expect(angles[0]).toBe(0)
    expect(angles[1]).toBe(Math.PI / 2)
  })

  it('adds boundary angles when shape exceeds diagonal limit', () => {
    const angles = computeCandidateAngles(200, 200, 256, 256)
    expect(angles.length).toBeGreaterThan(2)
  })

  it('all angles are within [0, π/2]', () => {
    const angles = computeCandidateAngles(200, 200, 256, 256)
    for (const angle of angles) {
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThanOrEqual(Math.PI / 2)
    }
  })
})

describe('fitsShapeOnBed', () => {
  const w0 = 256
  const h0 = 238
  const w = 256
  const h = 256

  it('fits landscape', () => {
    const result = fitsShapeOnBed(100, 50, w0, h0, w, h)
    expect(result.fits).toBe(true)
  })

  it('fits portrait but not landscape', () => {
    const result = fitsShapeOnBed(50, 250, w0, h0, w, h)
    expect(result.fits).toBe(true)
  })

  it('fits diagonally when too large for straight', () => {
    const result = fitsShapeOnBed(250, 245, w0, h0, w, h)
    expect(result.fits).toBe(true)
  })

  it('does not fit when exceeding diagonal limits', () => {
    const result = fitsShapeOnBed(300, 300, w0, h0, w, h)
    expect(result.fits).toBe(false)
  })

  it('exact fit on straight bed', () => {
    const result = fitsShapeOnBed(256, 238, w0, h0, w, h)
    expect(result.fits).toBe(true)
  })

  it('reports best angle when no fit', () => {
    const result = fitsShapeOnBed(260, 240, w0, h0, w, h)
    expect(result.fits).toBe(false)
    expect(result.optAngle).toBeGreaterThanOrEqual(0)
    expect(result.optAngle).toBeLessThanOrEqual(Math.PI / 2)
  })

  it('reports non-negative dimensions when no fit', () => {
    const result = fitsShapeOnBed(300, 300, w0, h0, w, h)
    expect(result.maxXAtOpt).toBeGreaterThanOrEqual(0)
    expect(result.maxYAtOpt).toBeGreaterThanOrEqual(0)
  })
})

describe('getShapePairs', () => {
  it('returns empty for 0 shapes', () => {
    expect(getShapePairs([])).toHaveLength(0)
  })

  it('returns empty for 1 shape', () => {
    expect(getShapePairs([{ name: 'A' }])).toHaveLength(0)
  })

  it('returns 1 pair for 2 shapes', () => {
    const pairs = getShapePairs([{ name: 'A' }, { name: 'B' }])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].first.name).toBe('A')
    expect(pairs[0].second.name).toBe('B')
    expect(pairs[0].firstName).toBe('A')
    expect(pairs[0].secondName).toBe('B')
  })

  it('returns 3 pairs for 3 shapes', () => {
    const pairs = getShapePairs([{ name: 'A' }, { name: 'B' }, { name: 'C' }])
    expect(pairs).toHaveLength(3)
  })

  it('returns 6 pairs for 4 shapes', () => {
    const shapes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]
    expect(getShapePairs(shapes)).toHaveLength(6)
  })

  it('follows n*(n-1)/2 formula', () => {
    for (const n of [2, 3, 4, 5, 6, 7, 8]) {
      const shapes = Array.from({ length: n }, (_, i) => ({ name: `${i}` }))
      expect(getShapePairs(shapes)).toHaveLength((n * (n - 1)) / 2)
    }
  })

  it('never pairs a shape with itself', () => {
    const shapes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    const pairs = getShapePairs(shapes)
    for (const { first, second } of pairs) {
      expect(first).not.toBe(second)
    }
  })

  it('produces no duplicate pairs', () => {
    const shapes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]
    const pairs = getShapePairs(shapes)
    const keys = pairs.map(({ first, second }) => `${first.name}-${second.name}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
