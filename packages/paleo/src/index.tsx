import { memo } from 'react'
import { DebugAxes, renderComponent, useShapeContext } from '@jsxcad/game'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MAMMOTHSKULL_SIZE, MammothSkullBox } from './MammothSkullBox.js'
import { Box } from './Box.js'
import { CardHolder } from './CardHolder.js'
import { FarmBasePlate, GraveyardBasePlate, GraveyardHeightPlate } from './Plates.js'
import { House } from './House.js'
import { Stand } from './Stand.js'
import { BigTokenThin, getBigTokenThinSize } from './BigTokenThin.js'
import { BigTokenMain, getBigTokenMainSize } from './BigTokenMain.js'

const StandPart = () => (
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
)

const App = memo(() => {
  const { wall, floor } = useShapeContext()
  return (
    <entity name={'paleo'}>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <Box />
      <StandPart />
      <translate by={{ y: DIMS.cards.a.x + 10 }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>
      <translate by={{ x: MAMMOTHSKULL_SIZE.y, y: DIMS.cards.a.x + 11, z: getBigTokenMainSize(floor).z }}>
        <rotate by={{ z: Math.PI / 2 }}>
          <MammothSkullBox />
        </rotate>
      </translate>
      <translate by={{ x: DIMS.box.x, y: getBigTokenThinSize(floor).x }}>
        <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
          <BigTokenThin />
        </rotate>
      </translate>
      <translate by={{ y: DIMS.cards.a.x + 11 }}>
        <BigTokenMain />
      </translate>
    </entity>
  )
})

const Root = () => {
  return <App />
}

const RootDebug = () => {
  return (
    <>
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <BigTokenMain />
    </>
  )
}

renderComponent(<Root />, {
  // filter: (s) => s.type !== ShapeType.Lid,
}).catch(logger.error)
