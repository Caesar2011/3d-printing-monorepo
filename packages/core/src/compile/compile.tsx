import fs from 'node:fs/promises'
import path from 'node:path'

import { serialize } from '@jscad/3mf-serializer'
import type { ReactElement } from 'react'
import { findProjectRoot } from '@jsxcad/utils'

import { ShapeType } from '../Shape.js'
import { parseAst } from '../render.js'
import { logger } from '../logger.js'

import type { RenderCallbacks, RenderOptions } from './types.js'
import { RenderMethod } from './types.js'
import { RenderContextProvider } from './RenderContext.js'

export async function compile(root: ReactElement, options: RenderOptions & RenderCallbacks) {
  const opts: Required<RenderOptions> & RenderCallbacks = {
    filePath: 'public/output.3mf',
    method: RenderMethod.All,
    filter: () => true,
    dev: false,
    ...options,
  }
  opts.onStart?.()

  const rootNode = await parseAst(<RenderContextProvider {...opts}>{root}</RenderContextProvider>)

  opts.onParsedAst?.()

  const shapes = rootNode.render()

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

  const mf3Data = serialize({ compress: true }, ...shapes)[0]

  opts.onSerialized?.()

  const filePath = path.isAbsolute(opts.filePath)
    ? opts.filePath
    : path.join(findProjectRoot(opts.fileDir), opts.filePath)
  await fs.writeFile(filePath, Buffer.from(mf3Data))

  opts.onSaved?.(filePath)
}
