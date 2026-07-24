import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { HiddenTokens, getHiddenTokenSize } from './HiddenTokens.js'

const FLOOR = 2

describe('HiddenTokens', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(getHiddenTokenSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(getHiddenTokenSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<HiddenTokens />)
  })
})
