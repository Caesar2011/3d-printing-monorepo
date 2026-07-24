import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { FarmTokens, getFarmTokenSize } from './FarmTokens.js'

const FLOOR = 2

describe('FarmTokens', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(getFarmTokenSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(getFarmTokenSize(FLOOR), PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<FarmTokens />)
  })
})
