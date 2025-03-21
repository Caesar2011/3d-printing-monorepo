import { PersistantReconciler } from '@jsxcad/reconciler'

import type { Instance, Container } from './ShapeType.js'
import { createShape, OperatorType, RootNode } from './ShapeType.js'

export async function render(element: React.ReactNode) {
  const renderer = PersistantReconciler<Instance, OperatorType, Container>(
    createShape,
    (instance) => instance instanceof OperatorType,
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
  console.dir(container, { depth: Infinity })
  return container.render()
}
