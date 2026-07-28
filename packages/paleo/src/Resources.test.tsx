import { describe } from 'vitest'
import React from 'react'
import { fitsOnPrinterBed, fitsOnPrinterHeight, getShapes, noOverlap, PRINTER_CONFIG } from '@jsxcad/testing'

import { BuildResources, FoodResources, LifeResources } from './Resources.js'

const foodShapes = await getShapes(<FoodResources />)
const buildShapes = await getShapes(<BuildResources />)
const lifeShapes = await getShapes(<LifeResources />)

const resourceTests = (shapes: Awaited<ReturnType<typeof getShapes>>) => {
  describe('fits on printer bed', () => fitsOnPrinterBed(shapes, PRINTER_CONFIG.P1S))

  describe('fits printer build height', () => fitsOnPrinterHeight(shapes, PRINTER_CONFIG.P1S))

  describe('does not overlap', () => noOverlap(shapes))
}

describe('FoodResources', () => {
  resourceTests(foodShapes)
})

describe('BuildResources', () => {
  resourceTests(buildShapes)
})

describe('LifeResources', () => {
  resourceTests(lifeShapes)
})
