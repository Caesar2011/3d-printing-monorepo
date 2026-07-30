import * as path from 'node:path'

import { DebugAxes, PrimitiveContextProvider } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'
import { renderComponent } from '@jsxcad/server'

import { logger } from './logger.js'
import { Box } from './Box.js'

export const SkullKing = () => (
  <entity name="skullKing">
    <Box />
  </entity>
)

const SkullKingDev = () => (
  <entity name="skullKingDev">
    <pick typeBlacklist={[ShapeType.Lid]}>
      <DebugAxes x={200} y={200} z={50} />
      <Box />
    </pick>
  </entity>
)

const SkullKingExport = () => (
  <PrimitiveContextProvider cylinderSegments={128} sphereSegments={128}>
    <pick typeWhitelist={[ShapeType.Part, ShapeType.Lid]}>
      <SkullKing />
    </pick>
  </PrimitiveContextProvider>
)

renderComponent(<SkullKingExport />, {
  fileDir: path.join(import.meta.dirname, '../../server'),
  dev: false,
}).catch(logger.error)
