import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { BigTokenThin, getBigTokenThinSize } from './BigTokenThin.js'

const FLOOR = 2

describe('BigTokenThin', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(getBigTokenThinSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(getBigTokenThinSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<BigTokenThin />)
  })
})
