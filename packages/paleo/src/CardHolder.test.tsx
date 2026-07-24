import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/core'

import { CardHolder, getCardHolderSize } from './CardHolder.js'

describe('CardHolder', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(getCardHolderSize(), PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(getCardHolderSize(), PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<CardHolder />)
  })
})
