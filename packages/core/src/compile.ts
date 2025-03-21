import fs from 'node:fs/promises'
import path from 'node:path'

import { serialize } from '@jscad/3mf-serializer'
import type { ReactElement } from 'react'

import type { Shape } from './Shape.js'
import { ShapeType } from './Shape.js'
import { parseAst } from './render.js'

export enum RenderMethod {
  All,
  NoContent,
  Flat,
}

export type RenderOptions = {
  fileDir: string
  filePath?: string
  method?: RenderMethod
  filter?: (s: Shape) => boolean
  dev?: boolean
  repeat?: number
}

export type RenderCallbacks = {
  onStart?: () => void
  onParsedAst?: () => void
  onRendered?: () => void
  onChecksDone?: () => void
  onSerialized?: () => void
  onSaved?: (filePath: string) => void
}

export async function findProjectRoot(startDir: string): Promise<string> {
  let currentDir = startDir

  while (true) {
    const packagePath = path.join(currentDir, 'package.json')
    const isPackageJsonPresent = await fs.access(packagePath, fs.constants.R_OK).then(
      () => true,
      () => false,
    )

    if (isPackageJsonPresent) {
      return currentDir
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      throw new Error('No package.json found in the directory tree.')
    }
    currentDir = parentDir
  }
}

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

  const rootNode = await parseAst(root)

  opts.onParsedAst?.()

  const shapes = rootNode.render()

  opts.onRendered?.()

  if (opts.dev) console.warn('Dev mode is enabled!')
  if (opts.repeat !== 1) console.warn(`Repeat is set to ${opts.repeat}!`)

  const check = (condition: boolean, message: string): void => {
    if (!condition) {
      if (opts.dev) {
        console.warn(`\x1b[33mWarning: ${message}\x1b[0m`)
      } else {
        throw new Error(`Render error: ${message}`)
      }
    }
  }

  const unspecifiedShapes = shapes.filter((shape) => shape.type === ShapeType.Unspecified)
  check(
    unspecifiedShapes.length === 0,
    `The following shapes have an unspecified type: ${unspecifiedShapes.map((s) => s.name || '<unnamed>').join(', ')}`,
  )

  check(
    shapes.every((shape) => shape.name !== ''),
    'One or more shapes have an empty name',
  )

  const nameCounts = new Map<string, number>()
  for (const shape of shapes) {
    nameCounts.set(shape.name, (nameCounts.get(shape.name) ?? 0) + 1)
  }
  const duplicateNames = [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
  check(duplicateNames.length === 0, `Shape names must be unique, but found duplicates: ${duplicateNames.join(', ')}`)

  opts.onChecksDone?.()

  const mf3Data = serialize({ compress: true }, ...shapes)[0]

  opts.onSerialized?.()

  const filePath = path.isAbsolute(opts.filePath)
    ? opts.filePath
    : path.join(await findProjectRoot(opts.fileDir), opts.filePath)
  await fs.writeFile(filePath, Buffer.from(mf3Data))

  opts.onSaved?.(filePath)
}
