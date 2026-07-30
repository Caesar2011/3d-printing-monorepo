import { describe } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, getShapes, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { Box } from './Box.js'

const shapes = await getShapes(<Box />)

describe('Box', () => {
  describe('fits on printer bed', () => fitsOnPrinterBed(shapes, PRINTER_CONFIG.P1S))

  describe('fits printer build height', () => fitsOnPrinterHeight(shapes, PRINTER_CONFIG.P1S))

  describe('does not overlap', () => noOverlap(shapes))
})
