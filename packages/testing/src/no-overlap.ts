import { expect, test } from 'vitest'
import { Shape } from '@jsxcad/core'
import type { Shape as ShapeType } from '@jsxcad/core'

import { getShapePairs } from './utils.js'

export function noOverlap(shapes: ShapeType[]) {
  if (shapes.length < 2) {
    test('has at least 2 shapes', () => {
      expect(shapes.length, 'noOverlap requires at least 2 shapes').toBeGreaterThanOrEqual(2)
    })
    return
  }

  const pairs = getShapePairs(shapes)

  test.each(pairs)('$firstName / $secondName', ({ first, second }) => {
    const overlap = Shape.intersect([first, second], first)
    const volume = overlap.volume

    expect(volume, `Shapes ${first.name} and ${second.name} overlap by ${Math.round(volume)} mm³`).toBe(0)
  })
}
