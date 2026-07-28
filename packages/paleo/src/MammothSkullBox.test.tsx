import { describe } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, getShapes, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { MammothSkullBox } from './MammothSkullBox.js'

const shapes = await getShapes(<MammothSkullBox />)

describe('MammothSkullBox', () => {
  describe('fits on printer bed', () => fitsOnPrinterBed(shapes, PRINTER_CONFIG.P1S))

  describe('fits printer build height', () => fitsOnPrinterHeight(shapes, PRINTER_CONFIG.P1S))

  describe('does not overlap', () => noOverlap(shapes))
})
