import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { BigTokenMain, getBigTokenMainSize } from './BigTokenMain.js'

const FLOOR = 2

describe('BigTokenMain', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(getBigTokenMainSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(getBigTokenMainSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<BigTokenMain />)
  })
})
