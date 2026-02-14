import fs from 'node:fs'
import path from 'node:path'

import jscad from '@jscad/modeling'
import { describe, expect, test } from 'vitest'

import type { SvgOptions } from './types.js'

import { svgToGeom2s } from './index.js'

const defaultOptions: SvgOptions = { segments: 32 }

describe('svgToGeom2s', () => {
  test('simple rect SVG', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="50"/></svg>'
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
    const area = Math.abs(jscad.measurements.measureArea(geoms[0]))
    expect(area).toBeGreaterThan(0)
  })

  test('simple circle SVG', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25"/></svg>'
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
  })

  test('simple path SVG (closed triangle)', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 100 0 L 50 100 Z"/></svg>'
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
    const area = Math.abs(jscad.measurements.measureArea(geoms[0]))
    expect(area).toBeGreaterThan(0)
  })

  test('path with cubic beziers', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 C 30 0, 100 70, 100 100 L 0 100 Z"/></svg>'
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
  })

  test('path with evenodd fill-rule and two subpaths (hole)', () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<path d="M 0 0 L 20 0 L 20 20 L 0 20 Z M 5 5 L 15 5 L 15 15 L 5 15 Z" fill-rule="evenodd"/>',
      '</svg>',
    ].join('')
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
    const area = Math.abs(jscad.measurements.measureArea(geoms[0]))
    // 20*20 - 10*10 = 300
    expect(area).toBeCloseTo(300)
  })

  test('multiple shapes produce multiple geoms', () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<rect x="0" y="0" width="10" height="10"/>',
      '<circle cx="50" cy="50" r="5"/>',
      '</svg>',
    ].join('')
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(2)
  })

  test('empty SVG returns empty array', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(0)
  })

  test('complex multi-subpath with curves (synthetic)', () => {
    const subpath1 = 'M 0 0 C 10 0, 20 10, 20 20 L 0 20 Z'
    const subpath2 = 'M 5 5 C 10 5, 15 10, 15 15 L 5 15 Z'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${subpath1} ${subpath2}" fill-rule="evenodd"/></svg>`
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
  })

  test('path with comma-separated cubic bezier params', () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<path d="M 255.500 0.980 C 254.400 1.464, 250.350 1.894, 246.500 1.936',
      ' L 239.500 2.013 L 236.500 4.000 L 246.500 4.000 Z"/>',
      '</svg>',
    ].join('')
    const geoms = svgToGeom2s(svg, defaultOptions)
    expect(geoms).toHaveLength(1)
  })
})

describe('svgToGeom2s with energy1-simple.svg', () => {
  const svgPath = path.resolve(import.meta.dirname, '../../../anno/res/energy1-simple.svg')
  const svgExists = fs.existsSync(svgPath)

  test.skipIf(!svgExists)('loads and parses the energy1-simple.svg file', () => {
    const source = fs.readFileSync(svgPath, 'utf-8')
    expect(source.length).toBeGreaterThan(0)
    expect(source).toContain('<svg')
    expect(source).toContain('<path')
  })

  test.skipIf(!svgExists)('produces at least one geometry from energy1-simple.svg', () => {
    const source = fs.readFileSync(svgPath, 'utf-8')
    const geoms = svgToGeom2s(source, defaultOptions)
    expect(geoms.length).toBeGreaterThan(0)
  })

  test.skipIf(!svgExists)('produced geometries have non-zero area', () => {
    const source = fs.readFileSync(svgPath, 'utf-8')
    const geoms = svgToGeom2s(source, defaultOptions)
    for (const geom of geoms) {
      const area = Math.abs(jscad.measurements.measureArea(geom))
      expect(area).toBeGreaterThan(0)
    }
  })

  test.skipIf(!svgExists)('debugs the pipeline step by step', async () => {
    const source = fs.readFileSync(svgPath, 'utf-8')

    // Step 1: Deserialize
    const { deserializeSvg } = await import('./deserializer.js')
    const nodes = deserializeSvg(source)
    expect(nodes.length).toBeGreaterThan(0)
    expect(nodes[0].tag).toBe('svg')

    // Step 2: Find path elements
    const svgRoot = nodes[0]
    const pathNodes = svgRoot.children.filter((n) => n.tag === 'path')
    expect(pathNodes.length).toBeGreaterThan(0)

    // Step 3: Check d attribute is present and non-empty
    for (const pn of pathNodes) {
      expect(pn.attributes.d).toBeDefined()
      expect(pn.attributes.d!.length).toBeGreaterThan(0)
    }

    // Step 4: Parse path outlines
    const { parsePath } = await import('./path-parser.js')
    for (const pn of pathNodes) {
      const outlines = parsePath(pn.attributes.d!, 32)
      expect(outlines.length).toBeGreaterThan(0)

      // Each outline should have at least 3 points
      for (let i = 0; i < outlines.length; i++) {
        expect(
          outlines[i].length,
          `Outline ${i} has ${outlines[i].length} points, expected >= 3`,
        ).toBeGreaterThanOrEqual(3)
      }
    }

    // Step 5: Full processing
    const geoms = svgToGeom2s(source, defaultOptions)
    expect(geoms.length).toBeGreaterThan(0)
  })
})
