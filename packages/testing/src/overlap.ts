import { parseAst } from '@jsxcad/core'

import type { Shape } from '@jsxcad/core'

export type ShapePair = {
  firstShape: Shape
  secondShape: Shape
  firstName: string
  secondName: string
}

export async function getShapePairs(node: React.ReactNode): Promise<ShapePair[]> {
  const rootNode = await parseAst(node)
  const shapes = rootNode.render()
  return shapes.flatMap((firstShape, firstIndex) =>
    shapes.slice(firstIndex + 1).map((secondShape) => ({
      firstShape,
      secondShape,
      firstName: firstShape.name,
      secondName: secondShape.name,
    })),
  )
}
