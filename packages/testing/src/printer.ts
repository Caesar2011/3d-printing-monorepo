import { expect, test } from 'vitest'
import type { AxisRecordDefinition, Shape } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { fitsShapeOnBed, isLidOrPart } from './utils.js'

export const PRINTER_CONFIG = {
  P1S: { size: { x: 256, y: 238, z: 249 }, diagonalSize: 256 },
} as const

type PrinterConfig = {
  size: AxisRecordDefinition
  diagonalSize: AxisRecordDefinition
}

export function fitsOnPrinterBed(shapes: Shape[], printerConfig: PrinterConfig) {
  const filtered = shapes.filter(isLidOrPart)
  if (filtered.length === 0) {
    test('has shapes matching lid/part filter', () => {
      expect(filtered.length, 'fitsOnPrinterBed: no shapes matched lid/part filter').toBeGreaterThan(0)
    })
    return
  }

  test.each(filtered)('$name fits on bed', (shape) => {
    const { x, y } = V(shape.boundingBox.size)
    const w0 = V(printerConfig.size).x
    const h0 = V(printerConfig.size).y
    const w = V(printerConfig.diagonalSize).x
    const h = V(printerConfig.diagonalSize).y

    const result = fitsShapeOnBed(x, y, w0, h0, w, h)

    expect(
      result.fits,
      `Card holder footprint (${x} x ${y} mm) exceeds all supported printer-bed orientations: ` +
        `rotated at ${((result.optAngle * 180) / Math.PI).toFixed(1)}° <= ${w}x${h} mm ` +
        `(max ${result.maxXAtOpt.toFixed(1)} x ${y} mm or ${x} x ${result.maxYAtOpt.toFixed(1)} mm) ` +
        `or straight ${w0} x ${h0} mm.`,
    ).toBeTruthy()
  })
}

export function fitsOnPrinterHeight(shapes: Shape[], printerConfig: PrinterConfig) {
  const filtered = shapes.filter(isLidOrPart)
  if (filtered.length === 0) {
    test('has shapes matching lid/part filter', () => {
      expect(filtered.length, 'fitsOnPrinterHeight: no shapes matched lid/part filter').toBeGreaterThan(0)
    })
    return
  }

  test.each(filtered)('$name fits on height', (shape) => {
    const { z } = V(shape.boundingBox.size)
    const { z: zPrinter } = V(printerConfig.size)

    expect(z, `Card holder height (${z} mm) exceeds the ${zPrinter} mm printer build height`).toBeLessThanOrEqual(
      zPrinter,
    )
  })
}
