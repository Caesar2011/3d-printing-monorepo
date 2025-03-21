import { PersistantReconciler } from '@jsxcad/reconciler'

import type { PrimitiveNode } from './ShapeType.js'
import { createShape, OperatorNode, RootNode } from './ShapeType.js'

export async function render(element: React.ReactNode) {
  const renderer = PersistantReconciler<PrimitiveNode, OperatorNode, RootNode>(
    createShape,
    (instance) => instance instanceof OperatorNode,
  )

  const container = new RootNode()
  const reactContainer = renderer.createContainer(
    container,
    0,
    null,
    false,
    null,
    'player',
    (recoverableError: Error) => {
      console.error(recoverableError)
    },
    null,
  )
  await new Promise<void>((resolve) => renderer.updateContainer(element, reactContainer, null, resolve))
  return container.render()
}
