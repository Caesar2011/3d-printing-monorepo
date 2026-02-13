import type { Shape } from '../Shape.js'
import { ShapeType } from '../Shape.js'
import { logger } from '../logger.js'

export type ValidationReporter = (condition: boolean, message: string, meta: object) => void

export function createValidator(dev: boolean): ValidationReporter {
  return (condition, message, meta) => {
    if (condition) return
    if (dev) {
      // Dynamic import would be circular; accept logger as optional or just throw with context
      logger.warn(`[dev] ${message}`, meta)
    } else {
      throw new Error(`Render error: ${message}`, { cause: meta })
    }
  }
}

export function validateShapes(shapes: Shape[], check: ValidationReporter): void {
  const unspecified = shapes.filter((s) => s.type === ShapeType.Unspecified)
  check(unspecified.length === 0, 'Some shapes have an unspecified type', {
    shapes: unspecified.map((s) => s.name || '<unnamed>'),
  })

  check(
    shapes.every((s) => s.name !== ''),
    'One or more shapes have an empty name',
    {},
  )

  const nameCounts = new Map<string, number>()
  for (const shape of shapes) {
    nameCounts.set(shape.name, (nameCounts.get(shape.name) ?? 0) + 1)
  }
  const duplicates = [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
  check(duplicates.length === 0, 'Shape names must be unique, but found duplicates!', { shapes: duplicates })
}
