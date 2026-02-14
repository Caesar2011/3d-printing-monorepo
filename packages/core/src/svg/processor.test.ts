import jscad from '@jscad/modeling'
import { describe, expect, test } from 'vitest'

import { processNodes } from './processor.js'
import type { SvgNode, SvgOptions } from './types.js'

const defaultOptions: SvgOptions = { segments: 32 }

function makeSvgRoot(children: SvgNode[], attrs: Record<string, string> = {}): SvgNode[] {
  return [
    {
      tag: 'svg',
      attributes: { xmlns: 'http://www.w3.org/2000/svg', ...attrs },
      children,
      text: '',
    },
  ]
}

function pathNode(d: string, extraAttrs: Record<string, string> = {}): SvgNode {
  return { tag: 'path', attributes: { d, ...extraAttrs }, children: [], text: '' }
}

function rectNode(attrs: Record<string, string>): SvgNode {
  return { tag: 'rect', attributes: attrs, children: [], text: '' }
}

function circleNode(attrs: Record<string, string>): SvgNode {
  return { tag: 'circle', attributes: attrs, children: [], text: '' }
}

function ellipseNode(attrs: Record<string, string>): SvgNode {
  return { tag: 'ellipse', attributes: attrs, children: [], text: '' }
}

function polygonNode(points: string): SvgNode {
  return { tag: 'polygon', attributes: { points }, children: [], text: '' }
}

function groupNode(children: SvgNode[], attrs: Record<string, string> = {}): SvgNode {
  return { tag: 'g', attributes: attrs, children, text: '' }
}

describe('processNodes', () => {
  describe('rect', () => {
    test('creates geometry from rect', () => {
      const nodes = makeSvgRoot([rectNode({ x: '0', y: '0', width: '100', height: '50' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
      const area = Math.abs(jscad.measurements.measureArea(geoms[0]))
      expect(area).toBeGreaterThan(0)
    })

    test('returns empty for zero-size rect', () => {
      const nodes = makeSvgRoot([rectNode({ x: '0', y: '0', width: '0', height: '50' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(0)
    })

    test('supports rounded rect', () => {
      const nodes = makeSvgRoot([rectNode({ x: '0', y: '0', width: '100', height: '50', rx: '5' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })
  })

  describe('circle', () => {
    test('creates geometry from circle', () => {
      const nodes = makeSvgRoot([circleNode({ cx: '50', cy: '50', r: '25' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('returns empty for zero-radius circle', () => {
      const nodes = makeSvgRoot([circleNode({ cx: '50', cy: '50', r: '0' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(0)
    })
  })

  describe('ellipse', () => {
    test('creates geometry from ellipse', () => {
      const nodes = makeSvgRoot([ellipseNode({ cx: '50', cy: '50', rx: '30', ry: '20' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })
  })

  describe('polygon', () => {
    test('creates geometry from polygon', () => {
      const nodes = makeSvgRoot([polygonNode('0,0 10,0 10,10 0,10')])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('returns empty for fewer than 3 points', () => {
      const nodes = makeSvgRoot([polygonNode('0,0 10,0')])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(0)
    })
  })

  describe('path', () => {
    test('creates geometry from simple closed path', () => {
      const nodes = makeSvgRoot([pathNode('M 0 0 L 100 0 L 100 100 L 0 100 Z')])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('creates geometry from path with curves', () => {
      const nodes = makeSvgRoot([pathNode('M 0 0 C 50 0, 100 50, 100 100 L 0 100 Z')])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('handles evenodd fill-rule', () => {
      const d = 'M 0 0 L 20 0 L 20 20 L 0 20 Z M 5 5 L 15 5 L 15 15 L 5 15 Z'
      const nodes = makeSvgRoot([pathNode(d, { 'fill-rule': 'evenodd' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('returns empty for path with no d attribute', () => {
      const node: SvgNode = { tag: 'path', attributes: {}, children: [], text: '' }
      const nodes = makeSvgRoot([node])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(0)
    })

    test('handles path with only M command (no geometry)', () => {
      const nodes = makeSvgRoot([pathNode('M 0 0')])
      const geoms = processNodes(nodes, defaultOptions)
      // A single point cannot form a polygon — depends on fromPoints behavior
      // At minimum should not throw
      expect(geoms.length).toBeLessThanOrEqual(1)
    })
  })

  describe('groups', () => {
    test('processes children of g element', () => {
      const nodes = makeSvgRoot([groupNode([rectNode({ width: '10', height: '10' })])])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })

    test('applies group transform to children', () => {
      const noTransform = makeSvgRoot([rectNode({ width: '10', height: '10' })])
      const withTransform = makeSvgRoot([
        groupNode([rectNode({ width: '10', height: '10' })], { transform: 'translate(100, 100)' }),
      ])

      const geomsA = processNodes(noTransform, defaultOptions)
      const geomsB = processNodes(withTransform, defaultOptions)

      expect(geomsA).toHaveLength(1)
      expect(geomsB).toHaveLength(1)

      const boundsA = jscad.measurements.measureBoundingBox(geomsA[0])
      const boundsB = jscad.measurements.measureBoundingBox(geomsB[0])

      // Translated geometry should be offset
      expect(boundsB[0][0]).not.toBeCloseTo(boundsA[0][0], 0)
    })
  })

  describe('color', () => {
    test('applies fill color to geometry', () => {
      const nodes = makeSvgRoot([rectNode({ width: '10', height: '10', fill: '#ff0000' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
      expect(geoms[0].color).toBeDefined()
      expect(geoms[0].color![0]).toBeCloseTo(1)
      expect(geoms[0].color![1]).toBeCloseTo(0)
      expect(geoms[0].color![2]).toBeCloseTo(0)
    })

    test('no color for fill="none"', () => {
      const nodes = makeSvgRoot([rectNode({ width: '10', height: '10', fill: 'none' })])
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
      expect(geoms[0].color).toBeUndefined()
    })
  })

  describe('viewBox and dimensions', () => {
    test('uses viewBox for coordinate mapping', () => {
      const nodes = makeSvgRoot([rectNode({ width: '100', height: '100' })], {
        viewBox: '0 0 200 200',
        width: '100mm',
        height: '100mm',
      })
      const geoms = processNodes(nodes, defaultOptions)
      expect(geoms).toHaveLength(1)
    })
  })
})
