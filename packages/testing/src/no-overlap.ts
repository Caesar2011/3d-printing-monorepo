import { expect, test } from 'vitest'
import { Shape } from '@jsxcad/core'
import type { Shape as ShapeType } from '@jsxcad/core'

export function noOverlap(shapes: ShapeType[]) {
  const pairs = shapes.flatMap((firstShape, firstIndex) =>
    shapes.slice(firstIndex + 1).map((secondShape) => ({
      firstShape,
      secondShape,
      firstName: firstShape.name,
      secondName: secondShape.name,
    })),
  )

  test.each(pairs)('$firstName / $secondName', ({ firstShape, secondShape }) => {
    const overlap = Shape.intersect([firstShape, secondShape], firstShape)
    const volume = overlap.volume

    expect(volume, `Shapes ${firstShape.name} and ${secondShape.name} overlap by ${Math.round(volume)} mm³`).toBe(0)
  })
}
