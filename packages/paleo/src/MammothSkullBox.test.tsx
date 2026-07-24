import { describe, test } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { MammothSkullBox, MAMMOTH_SKULL_BOX_SIZE } from './MammothSkullBox.js'

describe('MammothSkullBox', () => {
  test('fits on printer bed', () => {
    fitsOnPrinterBed(MAMMOTH_SKULL_BOX_SIZE, PRINTER_CONFIG.P1S)
  })

  test('fits printer build height', () => {
    fitsOnPrinterHeight(MAMMOTH_SKULL_BOX_SIZE, PRINTER_CONFIG.P1S)
  })

  describe('does not overlap', async () => {
    await noOverlap(<MammothSkullBox />)
  })
})
