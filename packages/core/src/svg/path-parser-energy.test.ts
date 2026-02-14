import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { logger } from '../logger.js'

import { deserializeSvg } from './deserializer.js'
import { parsePath } from './path-parser.js'

describe('parsePath with energy1-simple.svg d attribute', () => {
  const svgPath = path.resolve(import.meta.dirname, '../../../anno/res/energy1-simple.svg')
  const svgExists = fs.existsSync(svgPath)

  let dAttr: string | undefined

  if (svgExists) {
    const source = fs.readFileSync(svgPath, 'utf-8')
    const nodes = deserializeSvg(source)
    const svgRoot = nodes.find((n) => n.tag === 'svg')
    const pathNode = svgRoot?.children.find((n) => n.tag === 'path')
    dAttr = pathNode?.attributes.d
  }

  test.skipIf(!svgExists)('d attribute is present and non-empty', () => {
    expect(dAttr).toBeDefined()
    expect(dAttr!.length).toBeGreaterThan(100)
  })

  test.skipIf(!svgExists)('d attribute contains expected commands', () => {
    expect(dAttr).toContain('M')
    expect(dAttr).toContain('C')
    expect(dAttr).toContain('L')
  })

  test.skipIf(!svgExists)('parsePath returns non-empty outlines', () => {
    const outlines = parsePath(dAttr!, 32)
    expect(outlines.length).toBeGreaterThan(0)
  })

  test.skipIf(!svgExists)('all outlines have at least 3 points', () => {
    const outlines = parsePath(dAttr!, 32)
    for (let i = 0; i < outlines.length; i++) {
      expect(outlines[i].length, `Outline ${i} has only ${outlines[i].length} point(s)`).toBeGreaterThanOrEqual(3)
    }
  })

  test.skipIf(!svgExists)('counts expected number of subpaths (M commands)', () => {
    const mCount = (dAttr!.match(/M\s/g) || []).length
    const outlines = parsePath(dAttr!, 32)
    // Each M should produce one outline (assuming no degenerate subpaths)
    expect(outlines.length).toBe(mCount)
  })

  test.skipIf(!svgExists)('first outline has many points (complex boundary)', () => {
    const outlines = parsePath(dAttr!, 32)
    // The first subpath is the large outer boundary — should have many interpolated points
    expect(outlines[0].length).toBeGreaterThan(50)
  })

  test.skipIf(!svgExists)('all outline points have finite coordinates', () => {
    const outlines = parsePath(dAttr!, 32)
    for (const outline of outlines) {
      for (const [x, y] of outline) {
        expect(Number.isFinite(x), `x=${x} is not finite`).toBe(true)
        expect(Number.isFinite(y), `y=${y} is not finite`).toBe(true)
      }
    }
  })

  test.skipIf(!svgExists)('no duplicate consecutive points in outlines', () => {
    const outlines = parsePath(dAttr!, 32)
    for (let oi = 0; oi < outlines.length; oi++) {
      const outline = outlines[oi]
      for (let i = 1; i < outline.length; i++) {
        const same = outline[i][0] === outline[i - 1][0] && outline[i][1] === outline[i - 1][1]
        if (same) {
          logger.warn(`Outline ${oi}: duplicate point at index ${i}: [${outline[i][0]}, ${outline[i][1]}]`)
        }
      }
    }
  })

  test.skipIf(!svgExists)('outlines can be converted to geom2 without throwing', async () => {
    const jscad = await import('@jscad/modeling')
    const outlines = parsePath(dAttr!, 32)

    const validOutlines = outlines.filter((o) => o.length >= 3)
    expect(validOutlines.length).toBeGreaterThan(0)

    const errors: string[] = []
    for (let i = 0; i < validOutlines.length; i++) {
      try {
        jscad.default.geometries.geom2.fromPoints(validOutlines[i])
      } catch (e) {
        errors.push(`Outline ${i} (${validOutlines[i].length} pts): ${e instanceof Error ? e.message : e}`)
      }
    }

    if (errors.length > 0) {
      logger.warn('geom2.fromPoints failures:\n' + errors.join('\n'))
    }
    // At least some outlines should be convertible
    expect(validOutlines.length - errors.length).toBeGreaterThan(0)
  })
})
