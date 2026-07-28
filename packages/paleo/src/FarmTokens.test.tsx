import { describe } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, getShapes, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { FarmTokens } from './FarmTokens.js'

const shapes = await getShapes(<FarmTokens />)

describe('FarmTokens', () => {
  describe('fits on printer bed', () => fitsOnPrinterBed(shapes, PRINTER_CONFIG.P1S))

  describe('fits printer build height', () => fitsOnPrinterHeight(shapes, PRINTER_CONFIG.P1S))

  describe('does not overlap', () => noOverlap(shapes))
})
