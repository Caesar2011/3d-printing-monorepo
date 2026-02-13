import type { ReactElement } from 'react'

import type { Shape } from '../Shape.js'
import { parseAst } from '../render.js'
import { logger } from '../logger.js'

import type { RenderCallbacks, RenderOptions } from './types.js'
import { RenderMethod } from './types.js'
import { RenderContextProvider } from './RenderContext.js'
import { serializeToJson, type JsonScene } from './serialize-json.js'
import { createValidator, validateShapes } from './validate-shapes.js'

export type WsRenderOptions = Omit<RenderOptions, 'filePath'> & {
  onScene?: (scene: JsonScene) => void
}

/** Compiles a React element tree into a JSON scene and delivers it via callback. */
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
      filePath=""
    >
      {root}
    </RenderContextProvider>,
  )

  opts.onParsedAst?.()

  const shapes: Shape[] = rootNode.render()

  opts.onRendered?.()

  if (opts.dev) logger.warn('Dev mode is enabled!')

  validateShapes(shapes, createValidator(opts.dev))

  opts.onChecksDone?.()

  const scene = serializeToJson(shapes)

  opts.onSerialized?.()
  opts.onScene?.(scene)

  return scene
}
