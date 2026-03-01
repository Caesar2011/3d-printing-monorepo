import { memo } from 'react'
import { DebugAxes, renderComponent } from '@jsxcad/game'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { Stand } from './Stand.js'
import { Box } from './Box.js'
import { CardHolder } from './CardHolder.js'

const App = memo(() => {
  return (
    <entity name={'paleo'}>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <Box />
      <translate by={{ y: DIMS.box.y - DIMS.stand.size.y }}>
        <Stand />
      </translate>
      <translate by={{ y: DIMS.cards.a.x + 10 }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
