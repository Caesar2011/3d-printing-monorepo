import { describe, expect, test, beforeEach } from 'vitest'
import jscad from '@jscad/modeling'

import { Shape, ShapeType } from './Shape.js'
import { PrimitiveNode } from './ShapeType.js'

beforeEach(() => {
  PrimitiveNode.clearCache()
})

describe('Shape.prism', () => {
  test('creates a 3D shape from a triangle', () => {
    const shape = Shape.prism({
      points: [
        [0, 0],
        [10, 0],
        [5, 10],
      ],
      height: 5,
      name: 'triangle',
      type: ShapeType.Part,
    })

    const polys = jscad.geometries.geom3.toPolygons(shape)
    expect(polys.length).toBeGreaterThan(0)
  })

  test('creates a 3D shape from a rectangle', () => {
    const shape = Shape.prism({
      points: [
        [0, 0],
        [10, 0],
        [10, 5],
        [0, 5],
      ],
      height: 3,
      name: 'rect',
      type: ShapeType.Part,
    })

    const bb = jscad.measurements.measureBoundingBox(shape)
    expect(bb[1][0]).toBeCloseTo(10)
    expect(bb[1][1]).toBeCloseTo(5)
    expect(bb[1][2]).toBeCloseTo(3)
  })

  test('creates a trapezoid', () => {
    const shape = Shape.prism({
      points: [
        [0, 0],
        [20, 0],
        [15, 10],
        [5, 10],
      ],
      height: 8,
      name: 'trapezoid',
      type: ShapeType.Part,
    })

    const bb = jscad.measurements.measureBoundingBox(shape)
    expect(bb[0][0]).toBeCloseTo(0)
    expect(bb[1][0]).toBeCloseTo(20)
    expect(bb[1][2]).toBeCloseTo(8)
  })

  test('creates a pentagon', () => {
    const sides = 5
    const radius = 10
    const points: [number, number][] = []
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides
      points.push([radius * Math.cos(angle), radius * Math.sin(angle)])
    }

    const shape = Shape.prism({
      points,
      height: 5,
      name: 'pentagon',
      type: ShapeType.Part,
    })

    const polys = jscad.geometries.geom3.toPolygons(shape)
    expect(polys.length).toBeGreaterThan(0)
  })

  test('applies center translation', () => {
    const shape = Shape.prism({
      points: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
      height: 5,
      center: { x: 100, y: 100 },
      name: 'centered',
      type: ShapeType.Part,
    })

    const bb = jscad.measurements.measureBoundingBox(shape)
    expect(bb[0][0]).toBeCloseTo(100)
    expect(bb[0][1]).toBeCloseTo(100)
  })

  test('throws for fewer than 3 points', () => {
    expect(() =>
      Shape.prism({
        points: [
          [0, 0],
          [10, 0],
        ],
        height: 5,
        name: 'bad',
        type: ShapeType.Part,
      }),
    ).toThrow('at least 3 points')
  })
})
