import { PersistantReconciler } from '@jsxcad/reconciler'

import type { PrimitiveNode } from './ShapeType.js'
import { createShape, OperatorNode, RootNode } from './ShapeType.js'
import { logger } from './logger.js'

export async function parseAst(element: React.ReactNode) {
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
      logger.error(recoverableError)
    },
    null,
  )
  await new Promise<void>((resolve) => renderer.updateContainer(element, reactContainer, null, resolve))
  return container
}
