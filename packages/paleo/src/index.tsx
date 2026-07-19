import { memo } from 'react'
import { DebugAxes, renderComponent, useShapeContext } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MAMMOTHSKULL_SIZE, MammothSkullBox } from './MammothSkullBox.js'
import { Box } from './Box.js'
import { CardHolder } from './CardHolder.js'
import { FarmBasePlate, GraveyardBasePlate, GraveyardHeightPlate } from './Plates.js'
import { House } from './House.js'
import { Stand } from './Stand.js'
import { BigTokenThin, getBigTokenThinSize } from './BigTokenThin.js'

const App = memo(() => {
  const { wall } = useShapeContext()
  return (
    <entity name={'paleo'}>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <Box />
      <translate by={{ y: DIMS.box.y - DIMS.stand.size.y }}>
        <Stand />
        <translate by={{ x: DIMS.stand.cardBoardWidth + DIMS.stand.outerSpace + 1 }}>
          <FarmBasePlate />
          <translate by={{ z: DIMS.plates.farm }}>
            <GraveyardBasePlate />
            <translate by={{ y: DIMS.stand.lowerBar.y - 13, z: DIMS.plates.graveyardBase }}>
              <GraveyardHeightPlate />
              <translate by={{ z: DIMS.plates.graveyardHeight }}>
                <House />
              </translate>
            </translate>
          </translate>
        </translate>
      </translate>
      <translate by={{ y: DIMS.cards.a.x + 10 }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>
      <translate by={{ x: MAMMOTHSKULL_SIZE.y, y: 98 }}>
        <rotate by={{ z: Math.PI / 2 }}>
          <MammothSkullBox />
        </rotate>
      </translate>
      <translate by={{ x: DIMS.box.x - getBigTokenThinSize(wall).x }}>
        <BigTokenThin />
      </translate>
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
