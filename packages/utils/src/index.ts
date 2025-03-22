import * as fs from 'node:fs'
import path from 'node:path'
import fsSync from 'node:fs'

import { createLogger as createWinstonLogger, format, transports } from 'winston'
import { consoleFormat } from 'winston-console-format'

export function createLogger(path: string) {
  const serviceName = JSON.parse(fs.readFileSync(findProjectRoot(path) + '/package.json', 'utf-8')).name as string
  return createWinstonLogger({
    level: 'silly',
    format: format.combine(
      format.timestamp(),
      format.ms(),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize({ all: true }),
          format.padLevels(),
          consoleFormat({
            showMeta: true,
            metaStrip: ['timestamp', 'service'],
            inspectOptions: {
              depth: Infinity,
              colors: true,
              maxArrayLength: Infinity,
              breakLength: 120,
              compact: Infinity,
            },
          }),
        ),
      }),
    ],
  })
}

export function findProjectRoot(startDir: string): string {
  let currentDir = startDir

  while (true) {
    const packagePath = path.join(currentDir, 'package.json')
    const isPackageJsonPresent = fsSync.existsSync(packagePath)

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

export function range(stop: number): number[]
export function range(start: number, stop: number): number[]
export function range(start: number, stop: number, step: number): number[]
export function range(a: number, b?: number, c?: number): number[] {
  const [start, stop, step] = b === undefined ? [0, a, 1] : c === undefined ? [a, b, 1] : [a, b, c]

  if (step === 0) throw new Error('range() arg 3 must not be zero')

  const result: number[] = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }
  return result
}
