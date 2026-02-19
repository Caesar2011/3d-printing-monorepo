import jscad from '@jscad/modeling'

import { logger } from '../logger.js'

const { maths } = jscad
const { mat4 } = maths

// --- Unit Parsing ---

const inchMM = 25.4
const ptMM = inchMM / 72
const pcMM = ptMM * 12

export function parseUnits(value: string | undefined, pmm = 3.54): number {
  if (value === undefined) return 0
  const num = parseFloat(value)
  if (isNaN(num)) return 0

  if (value.endsWith('mm')) return num
  if (value.endsWith('cm')) return num * 10
  if (value.endsWith('in')) return num * inchMM
  if (value.endsWith('pt')) return num * ptMM
  if (value.endsWith('pc')) return num * pcMM
  return num / pmm
}

// --- ViewBox Parsing ---

export interface ViewBox {
  minX: number
  minY: number
  width: number
  height: number
}

export function parseViewBox(value: string | undefined): ViewBox | undefined {
  if (value === undefined) return undefined
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(parseFloat)
  if (parts.length !== 4 || parts.some(isNaN)) return undefined
  return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] }
}

export function computePxPerMm(
  widthAttr: string | undefined,
  heightAttr: string | undefined,
  viewBox: ViewBox | undefined,
): number {
  const defaultPmm = 90 / 25.4

  if (viewBox === undefined) return defaultPmm

  const widthMm = widthAttr !== undefined ? parseUnits(widthAttr, defaultPmm) : undefined
  if (widthMm !== undefined && widthMm > 0) {
    return viewBox.width / widthMm
  }

  const heightMm = heightAttr !== undefined ? parseUnits(heightAttr, defaultPmm) : undefined
  if (heightMm !== undefined && heightMm > 0) {
    return viewBox.height / heightMm
  }

  return defaultPmm
}

// --- Transform Parsing ---

export function parseTransform(transformStr: string | undefined): jscad.maths.mat4.Mat4 | undefined {
  if (transformStr === undefined) return undefined

  const matrix: jscad.maths.mat4.Mat4 = mat4.create()
  const regex = /(\w+)\s*\(([^)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(transformStr))) {
    const [, name, argsStr] = match
    const args = argsStr
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)

    switch (name.toLowerCase()) {
      case 'translate': {
        const tx = args[0] || 0
        const ty = args.length > 1 ? args[1] : 0
        mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [tx, ty, 0]))
        break
      }
      case 'scale': {
        const sx = args[0] || 1
        const sy = args.length > 1 ? args[1] : sx
        mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [sx, sy, 1]))
        break
      }
      case 'rotate': {
        const angle = (args[0] * Math.PI) / 180
        if (args.length > 1) {
          const [cx, cy] = args.slice(1)
          mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [cx, cy, 0]))
          mat4.multiply(matrix, matrix, mat4.fromZRotation(mat4.create(), angle))
          mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [-cx, -cy, 0]))
        } else {
          mat4.multiply(matrix, matrix, mat4.fromZRotation(mat4.create(), angle))
        }
        break
      }
      case 'matrix':
        if (args.length === 6) {
          const [a, b, c, d, e, f] = args
          const m: jscad.maths.mat4.Mat4 = [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1]
          mat4.multiply(matrix, matrix, m)
        }
        break
      default:
        logger.warn(`SVG: unsupported transform function "${name}"`)
        break
    }
  }
  return matrix
}
