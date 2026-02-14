import { describe, expect, test, beforeEach } from 'vitest'

import { Shape, ShapeType } from '../Shape.js'
import { PrimitiveNode } from '../ShapeType.js'

import { serializeToJson } from './serialize-json.js'

beforeEach(() => {
  PrimitiveNode.clearCache()
})

describe('serializeToJson', () => {
  test('returns version 1', () => {
    const scene = serializeToJson([])
    expect(scene.version).toBe(1)
  })

  test('returns empty meshes for empty input', () => {
    const scene = serializeToJson([])
    expect(scene.meshes).toHaveLength(0)
  })

  test('serializes a cuboid into triangles', () => {
    const shape = Shape.cuboid({ size: 10, name: 'box', type: ShapeType.Part })
    const scene = serializeToJson([shape])

    expect(scene.meshes).toHaveLength(1)
    expect(scene.meshes[0].name).toBe('box')
    // A cube has 6 faces, each triangulated into 2 triangles = 12
    expect(scene.meshes[0].triangles.length).toBe(12)
  })

  test('each triangle has exactly 3 vertices', () => {
    const shape = Shape.cuboid({ size: 5, name: 'box', type: ShapeType.Part })
    const scene = serializeToJson([shape])

    for (const tri of scene.meshes[0].triangles) {
      expect(tri.vertices).toHaveLength(3)
      for (const v of tri.vertices) {
        expect(typeof v.x).toBe('number')
        expect(typeof v.y).toBe('number')
        expect(typeof v.z).toBe('number')
      }
    }
  })

  test('preserves shape name', () => {
    const shape = Shape.cuboid({ size: 1, name: 'my-part', type: ShapeType.Part })
    const scene = serializeToJson([shape])
    expect(scene.meshes[0].name).toBe('my-part')
  })

  test('color is null when shape has no color', () => {
    const shape = Shape.cuboid({ size: 1, name: 'nocolor', type: ShapeType.Part })
    const scene = serializeToJson([shape])
    expect(scene.meshes[0].color).toBeNull()
  })

  test('color is serialized as RGBA array', () => {
    const shape = Shape.cuboid({
      size: 1,
      name: 'colored',
      type: ShapeType.Part,
      color: [1, 0, 0, 1],
    })
    const scene = serializeToJson([shape])
    expect(scene.meshes[0].color).toEqual([1, 0, 0, 1])
  })

  test('serializes multiple shapes', () => {
    const shapes = [
      Shape.cuboid({ size: 1, name: 'a', type: ShapeType.Part }),
      Shape.sphere({ size: 1, segments: 8, name: 'b', type: ShapeType.Part }),
    ]
    const scene = serializeToJson(shapes)
    expect(scene.meshes).toHaveLength(2)
    expect(scene.meshes[0].name).toBe('a')
    expect(scene.meshes[1].name).toBe('b')
  })

  test('sphere produces triangles', () => {
    const shape = Shape.sphere({ size: 2, segments: 8, name: 'sphere', type: ShapeType.Part })
    const scene = serializeToJson([shape])
    expect(scene.meshes[0].triangles.length).toBeGreaterThan(0)
  })

  test('all vertex coordinates are finite', () => {
    const shape = Shape.cuboid({ size: 10, name: 'test', type: ShapeType.Part })
    const scene = serializeToJson([shape])

    for (const tri of scene.meshes[0].triangles) {
      for (const v of tri.vertices) {
        expect(Number.isFinite(v.x)).toBe(true)
        expect(Number.isFinite(v.y)).toBe(true)
        expect(Number.isFinite(v.z)).toBe(true)
      }
    }
  })
})
