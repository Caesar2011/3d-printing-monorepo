import * as path from 'node:path'

import { PrimitiveContextProvider } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'
import { renderComponent } from '@jsxcad/server'

import { logger } from './logger.js'
import { Box } from './Box.js'

export const Faraway = () => (
  <entity name="faraway">
    <Box />
  </entity>
)

const FarawayDev = () => (
  <entity name="farawayDev">
    <intersect>
      <pick typeWhitelist={[ShapeType.Part]}>
        <Box />
      </pick>
      <union>
        <pick typeWhitelist={[ShapeType.Content]}>
          <Box />
        </pick>
      </union>
    </intersect>
  </entity>
)

const FarawayExport = () => (
  <PrimitiveContextProvider cylinderSegments={128} sphereSegments={128}>
    <pick typeWhitelist={[ShapeType.Part, ShapeType.Lid]}>
      <Faraway />
    </pick>
  </PrimitiveContextProvider>
)

renderComponent(<FarawayExport />, {
  fileDir: path.join(import.meta.dirname, '../../server'),
  dev: false,
}).catch(logger.error)
