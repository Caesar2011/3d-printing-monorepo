import { expect, test } from 'vitest'

import { Shape } from '@jsxcad/core'

import { getShapePairs } from './overlap.js'

export async function noOverlap(node: React.ReactNode) {
  const shapePairs = await getShapePairs(node)

  test.each(shapePairs)('$firstName / $secondName', ({ firstShape, secondShape }) => {
    const overlap = Shape.intersect([firstShape, secondShape], firstShape)
    const volume = overlap.volume

    expect(volume, `Shapes ${firstShape.name} and ${secondShape.name} overlap by ${Math.round(volume)} mm³`).toBe(0)
  })
}
