import { describe, expect, test , beforeEach } from 'vitest'

import { Shape, ShapeType } from '../Shape.js'
import { PrimitiveNode } from '../ShapeType.js'

import { createValidator, validateShapes } from './validate-shapes.js'

// Clear cache before each test to avoid cross-test pollution

beforeEach(() => {
  PrimitiveNode.clearCache()
})

function makeShape(name: string, type: ShapeType = ShapeType.Part): Shape {
  return Shape.cuboid({ size: 1, name, type })
}

describe('createValidator', () => {
  test('dev=false throws on failed condition', () => {
    const check = createValidator(false)
    expect(() => check(false, 'test error', {})).toThrow('test error')
  })

  test('dev=false does nothing on passing condition', () => {
    const check = createValidator(false)
    expect(() => check(true, 'should not throw', {})).not.toThrow()
  })

  test('dev=true warns instead of throwing', () => {
    const check = createValidator(true)
    // Should not throw
    expect(() => check(false, 'warning', {})).not.toThrow()
  })
})

describe('validateShapes', () => {
  test('passes for valid shapes with unique names and types', () => {
    const shapes = [makeShape('partA', ShapeType.Part), makeShape('partB', ShapeType.Lid)]
    const check = createValidator(false)
    expect(() => validateShapes(shapes, check)).not.toThrow()
  })

  test('fails for shapes with unspecified type', () => {
    const shapes = [makeShape('partA', ShapeType.Unspecified)]
    const check = createValidator(false)
    expect(() => validateShapes(shapes, check)).toThrow(/unspecified type/)
  })

  test('fails for shapes with empty name', () => {
    const shapes = [makeShape('', ShapeType.Part)]
    const check = createValidator(false)
    expect(() => validateShapes(shapes, check)).toThrow(/empty name/)
  })

  test('fails for duplicate names', () => {
    const shapes = [makeShape('same', ShapeType.Part), makeShape('same', ShapeType.Lid)]
    const check = createValidator(false)
    expect(() => validateShapes(shapes, check)).toThrow(/duplicate/)
  })

  test('passes for empty shapes array', () => {
    const check = createValidator(false)
    expect(() => validateShapes([], check)).not.toThrow()
  })
})