import { describe } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, getShapes, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'
import { ShapeType } from '@jsxcad/core'

import { Paleo } from './index.js'

const shapes = await getShapes(
  <pick typeBlacklist={[ShapeType.Technical]}>
    <Paleo />
  </pick>,
)

describe('Paleo', () => {
  describe('fits on printer bed', () => fitsOnPrinterBed(shapes, PRINTER_CONFIG.P1S))

  describe('fits printer build height', () => fitsOnPrinterHeight(shapes, PRINTER_CONFIG.P1S))

  describe('does not overlap', () => noOverlap(shapes))
})
