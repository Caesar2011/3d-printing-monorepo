import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { deserializeSvg } from './deserializer.js'
import { extractOutlines } from './outline-extractor.js'

describe('extractOutlines', () => {
  test('parses a simple rect', () => {
    const nodes = deserializeSvg('<svg><rect x="10" y="10" width="100" height="50"/></svg>')
    const groups = extractOutlines(nodes, { segments: 32 })

    expect(groups).toHaveLength(1)
    expect(groups[0].outlines).toHaveLength(1)
    expect(groups[0].outlines[0].role).toBe('solid')
    expect(groups[0].outlines[0].points.length).toBe(4)
  })

  test('parses a path with a hole using fill-rule="evenodd"', () => {
    // An outer square and a nested inner square.
    const d = 'M0 0 H100 V100 H0 Z M20 20 V80 H80 V20 Z'
    const nodes = deserializeSvg(`<svg><path d="${d}" fill-rule="evenodd"/></svg>`)
    const groups = extractOutlines(nodes, { segments: 32 })

    expect(groups).toHaveLength(1)
    expect(groups[0].outlines).toHaveLength(2)

    const solid = groups[0].outlines.find((o) => o.role === 'solid')
    const hole = groups[0].outlines.find((o) => o.role === 'hole')

    expect(solid).toBeDefined()
    expect(hole).toBeDefined()
  })

  test('applies group transforms to children', () => {
    const nodes = deserializeSvg(
      '<svg><g transform="translate(50, 0) scale(2)"><rect x="0" y="0" width="10" height="10"/></g></svg>',
    )
    const groups = extractOutlines(nodes, { segments: 32 })

    expect(groups).toHaveLength(1)
    const points = groups[0].outlines[0].points
    const minX = Math.min(...points.map((p) => p[0]))

    // The rect starts at x=0, is scaled by 2 (still at 0), then translated by 50.
    // The pmm conversion scales this down, but the leftmost point must be > 0.
    // Let's check a reasonable bound.
    expect(minX).toBeGreaterThan(10)
  })

  describe('with energy1-simple.svg', () => {
    const svgPath = path.resolve(import.meta.dirname, '../../../anno/res/energy1-simple.svg')
    const svgExists = fs.existsSync(svgPath)

    test.skipIf(!svgExists)('produces one group with multiple solids and holes', () => {
      const source = fs.readFileSync(svgPath, 'utf-8')
      const nodes = deserializeSvg(source)
      const groups = extractOutlines(nodes, { segments: 32 })

      // The file contains a single <path> element, which should be one group.
      expect(groups).toHaveLength(1)

      const group = groups[0]
      const solids = group.outlines.filter((o) => o.role === 'solid')
      const holes = group.outlines.filter((o) => o.role === 'hole')

      // This specific SVG has a large outer boundary and many small inner shapes.
      // With `evenodd`, some of these will be solids and some will be holes.
      expect(solids.length).toBeGreaterThan(0)
      expect(holes.length).toBeGreaterThan(0)

      // The largest outline by point count should be the main container, a solid.
      const largestOutline = [...group.outlines].sort((a, b) => b.points.length - a.points.length)[0]
      expect(largestOutline.role).toBe('solid')
    })
  })
})
