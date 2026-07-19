import { memo } from 'react'
import { DebugAxes, renderComponent } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MammothSkullBox } from './MammothSkullBox.js'

const App = memo(() => {
  return (
    <entity name={'paleo'}>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      {/*<Box />
      <translate by={{ y: DIMS.box.y - DIMS.stand.size.y }}>
        <Stand />
      </translate>
      <translate by={{ y: DIMS.cards.a.x + 10 }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>*/}
      <MammothSkullBox />
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />, {
  filter: (s) => {
    logger.warn('TYPE', { name: s.name, type: ShapeType[s.type] })
    return s.type !== ShapeType.Lid
  },
}).catch(logger.error)
