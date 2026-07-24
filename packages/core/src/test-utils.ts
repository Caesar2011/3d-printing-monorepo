import jscad from '@jscad/modeling'
import { expect, test } from 'vitest'

import { Shape } from './Shape.js'

import type { AxisRecordDefinition } from './index.js'
import { parseAst, V } from './index.js'

export const PRINTER_CONFIG = {
  P1S: { size: { x: 256, y: 238, z: 249 }, diagonalSize: 256 },
} as const

async function getShapePairs(cardHolder: React.ReactNode) {
  const rootNode = await parseAst(cardHolder)

  const shapes = rootNode.render()
  return shapes.flatMap((firstShape, firstIndex) =>
    shapes.slice(firstIndex + 1).map((secondShape) => ({
      firstShape,
      secondShape,
      firstName: firstShape.name,
      secondName: secondShape.name,
    })),
  )
}

type PrinterConfig = {
  size: AxisRecordDefinition
  diagonalSize: AxisRecordDefinition
}

export function fitsOnPrinterBed(size: AxisRecordDefinition, printerConfig: PrinterConfig) {
  const x = V(size).x
  const y = V(size).y

  const w0 = V(printerConfig.size).x
  const h0 = V(printerConfig.size).y
  const w = V(printerConfig.diagonalSize).x
  const h = V(printerConfig.diagonalSize).y

  const fitsLandscape = x <= w0 && y <= h0
  const fitsPortrait = x <= h0 && y <= w0

  const angles = [0, Math.PI / 2]
  const addBoundaryAngles = (firstSide: number, secondSide: number, limit: number) => {
    const radius = Math.hypot(firstSide, secondSide)
    const offset = Math.atan2(secondSide, firstSide)
    const delta = Math.acos(limit / radius)

    for (const angle of [offset - delta, offset + delta]) {
      if (angle >= 0 && angle <= Math.PI / 2) angles.push(angle)
    }
  }

  // A fit can first occur only at an axis-aligned orientation or where one
  // projected side reaches a bed boundary.
  if (w <= Math.hypot(x, y)) addBoundaryAngles(x, y, w)
  if (h <= Math.hypot(x, y)) addBoundaryAngles(y, x, h)

  const diagonalAngle = angles.find((angle) => {
    const projX = x * Math.cos(angle) + y * Math.sin(angle)
    const projY = x * Math.sin(angle) + y * Math.cos(angle)
    return projX <= w && projY <= h
  })
  const fitsDiagonally = diagonalAngle !== undefined
  const optAngle =
    diagonalAngle ??
    angles.reduce((bestAngle, angle) => {
      const bestOverflow = Math.max(
        (x * Math.cos(bestAngle) + y * Math.sin(bestAngle)) / w,
        (x * Math.sin(bestAngle) + y * Math.cos(bestAngle)) / h,
      )
      const overflow = Math.max(
        (x * Math.cos(angle) + y * Math.sin(angle)) / w,
        (x * Math.sin(angle) + y * Math.cos(angle)) / h,
      )
      return overflow < bestOverflow ? angle : bestAngle
    })
  const sin = Math.sin(optAngle)
  const cos = Math.cos(optAngle)
  const maxXAtOpt = Math.max(0, Math.min((w - y * sin) / cos, (h - y * cos) / sin))
  const maxYAtOpt = Math.max(0, Math.min((w - x * cos) / sin, (h - x * sin) / cos))

  expect(
    fitsDiagonally || fitsLandscape || fitsPortrait,
    `Card holder footprint (${x} x ${y} mm) exceeds all supported printer-bed orientations: ` +
      `rotated at ${((optAngle * 180) / Math.PI).toFixed(1)}° <= ${w}x${h} mm ` +
      `(max ${maxXAtOpt.toFixed(1)} x ${y} mm or ${x} x ${maxYAtOpt.toFixed(1)} mm) ` +
      `or straight ${w0} x ${h0} mm.`,
  ).toBeTruthy()
}

export function fitsOnPrinterHeight(size: AxisRecordDefinition, printerConfig: PrinterConfig) {
  const { z } = V(size)
  const { z: zPrinter } = V(printerConfig.size)

  expect(z, `Card holder height (${z} mm) exceeds the ${zPrinter} mm printer build height`).toBeLessThanOrEqual(
    zPrinter,
  )
}

export async function noOverlap(node: React.ReactNode) {
  const shapePairs = await getShapePairs(node)

  test.each(shapePairs)('$firstName / $secondName', ({ firstShape, secondShape }) => {
    const overlap = Shape.intersect([firstShape, secondShape], firstShape)
    const volume = jscad.measurements.measureVolume(overlap)

    expect(volume, `Shapes ${firstShape.name} and ${secondShape.name} overlap by ${Math.round(volume)} mm³`).toBe(0)
  })
}
