import { memo } from 'react'
import { DebugAxes, renderComponent } from '@jsxcad/game'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { Stand } from './Stand.js'
import { Box } from './Box.js'

const App = memo(() => {
  return (
    <entity name={'paleo'}>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <Box />
      <translate by={{ y: DIMS.box.y - DIMS.stand.size.y }}>
        <Stand />
      </translate>
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
