import fs from 'node:fs/promises'
import path from 'node:path'

import { serialize } from '@jscad/3mf-serializer'
import type { ReactElement } from 'react'
import { findProjectRoot } from '@jsxcad/utils'

import { parseAst } from '../render.js'
import { logger } from '../logger.js'

import type { RenderCallbacks, RenderOptions } from './types.js'
import { RenderMethod } from './types.js'
import { RenderContextProvider } from './RenderContext.js'
import { createValidator, validateShapes } from './validate-shapes.js'

export async function compile(root: ReactElement, options: RenderOptions & RenderCallbacks) {
  const opts: Required<RenderOptions> & RenderCallbacks = {
    filePath: 'public/output.3mf',
    method: RenderMethod.All,
    filter: () => true,
    dev: false,
    repeat: 1,
    ...options,
  }
  opts.onStart?.()

  const rootNode = await parseAst(<RenderContextProvider {...opts}>{root}</RenderContextProvider>)

  opts.onParsedAst?.()

  const shapes = rootNode.render()

  opts.onRendered?.()

  if (opts.dev) logger.warn('Dev mode is enabled!')

  validateShapes(shapes, createValidator(opts.dev))

  opts.onChecksDone?.()

  const mf3Data = serialize({ compress: true }, ...shapes)[0]

  opts.onSerialized?.()

  const filePath = path.isAbsolute(opts.filePath)
    ? opts.filePath
    : path.join(findProjectRoot(opts.fileDir), opts.filePath)
  await fs.writeFile(filePath, Buffer.from(mf3Data))

  opts.onSaved?.(filePath)
}
