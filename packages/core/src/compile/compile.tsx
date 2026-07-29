import fs from 'node:fs/promises'
import path from 'node:path'

import { serialize } from '@jscad/3mf-serializer'
import type { ReactElement } from 'react'
import { findProjectRoot } from '@jsxcad/utils'

import { parseAst } from '../render.js'
import { logger } from '../logger.js'

import { serializeToJson } from './serialize-json.js'
import type { RenderCallbacks, RenderOptions } from './types.js'
import { RenderMethod } from './types.js'
import { RenderContextProvider } from './RenderContext.js'
import { createValidator, validateShapes } from './validate-shapes.js'

export async function compile(root: ReactElement, options: RenderOptions & RenderCallbacks) {
  const opts: Required<RenderOptions> & RenderCallbacks = {
    filePath: 'public/output.3mf',
    method: RenderMethod.All,
    dev: false,
    ...options,
  }
  opts.onStart?.()

  const rootNode = await parseAst(<RenderContextProvider {...opts}>{root}</RenderContextProvider>)

  opts.onParsedAst?.()

  const shapes = rootNode.render()

  opts.onRendered?.(shapes)

  if (opts.dev) logger.warn('Dev mode is enabled!')
  logger.info(`Shapes found:`, { names: shapes.map((shape) => shape.name) })

  validateShapes(shapes, createValidator(opts.dev))

  opts.onChecksDone?.()

  const filePath = path.isAbsolute(opts.filePath)
    ? opts.filePath
    : path.join(findProjectRoot(opts.fileDir), opts.filePath)

  if (opts.renderTarget === '3mf') {
    const mf3Data = serialize({ compress: true }, ...shapes)[0]
    opts.onSerialized?.(mf3Data)
    await fs.writeFile(filePath, Buffer.from(mf3Data))
  } else {
    const scene = serializeToJson(shapes)
    opts.onSerialized?.(scene)
  }

  opts.onSaved?.(filePath)
}
