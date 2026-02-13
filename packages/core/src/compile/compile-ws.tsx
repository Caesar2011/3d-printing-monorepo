import type { ReactElement } from 'react'

import type { Shape } from '../Shape.js'
import { ShapeType } from '../Shape.js'
import { parseAst } from '../render.js'
import { logger } from '../logger.js'

import type { RenderCallbacks, RenderOptions } from './types.js'
import { RenderMethod } from './types.js'
import { RenderContextProvider } from './RenderContext.js'
import { serializeToJson, type JsonScene } from './serialize-json.js'

export type WsRenderOptions = Omit<RenderOptions, 'filePath'> & {
  onScene?: (scene: JsonScene) => void
}

/**
 * Compiles a React element tree into a JSON scene and delivers it via callback.
 * Use this instead of `compile` when streaming to a WebSocket viewer.
 */
export async function compileToJson(
  root: ReactElement,
  options: WsRenderOptions & RenderCallbacks,
): Promise<JsonScene> {
  const opts: Required<WsRenderOptions> & RenderCallbacks = {
    method: RenderMethod.All,
    filter: () => true,
    dev: false,
    repeat: 1,
    onScene: () => {},
    ...options,
  }

  opts.onStart?.()

  const rootNode = await parseAst(
    <RenderContextProvider
      fileDir={opts.fileDir}
      method={opts.method}
      filter={opts.filter}
      dev={opts.dev}
      repeat={opts.repeat}
      filePath={''}
    >
      {root}
    </RenderContextProvider>,
  )

  opts.onParsedAst?.()

  const shapes: Shape[] = rootNode.render()

  opts.onRendered?.()

  if (opts.dev) logger.warn('Dev mode is enabled!')

  const check = (condition: boolean, message: string, meta: object): void => {
    if (!condition) {
      if (opts.dev) {
        logger.warn(message, meta)
      } else {
        throw new Error(`Render error: ${message}`, { cause: meta })
      }
    }
  }

  const unspecifiedShapes = shapes.filter((shape) => shape.type === ShapeType.Unspecified)
  check(unspecifiedShapes.length === 0, `Some shapes have an unspecified type`, {
    shapes: unspecifiedShapes.map((s) => s.name || '<unnamed>'),
  })

  check(
    shapes.every((shape) => shape.name !== ''),
    'One or more shapes have an empty name',
    {},
  )

  const nameCounts = new Map<string, number>()
  for (const shape of shapes) {
    nameCounts.set(shape.name, (nameCounts.get(shape.name) ?? 0) + 1)
  }
  const duplicateNames = [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
  check(duplicateNames.length === 0, `Shape names must be unique, but found duplicates!`, { shapes: duplicateNames })

  opts.onChecksDone?.()

  const scene = serializeToJson(shapes)

  opts.onSerialized?.()
  opts.onScene?.(scene)

  return scene
}
