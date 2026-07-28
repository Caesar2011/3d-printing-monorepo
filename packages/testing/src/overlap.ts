import { parseAst } from '@jsxcad/core'
import type { Shape } from '@jsxcad/core'

export async function getShapes(node: React.ReactNode): Promise<Shape[]> {
  const rootNode = await parseAst(node)
  return rootNode.render()
}
