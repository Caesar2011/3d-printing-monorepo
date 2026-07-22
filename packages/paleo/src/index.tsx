import { DebugAxes, renderComponent, useShapeContext } from '@jsxcad/game'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MAMMOTH_SKULL_BOX_SIZE, MammothSkullBox } from './MammothSkullBox.js'
import { Box } from './Box.js'
import { CardHolder } from './CardHolder.js'
import { FarmBasePlate, GraveyardBasePlate, GraveyardHeightPlate } from './Plates.js'
import { House } from './House.js'
import { Stand } from './Stand.js'
import { BigTokenThin, getBigTokenThinSize } from './BigTokenThin.js'
import { BigTokenMain, getBigTokenMainSize } from './BigTokenMain.js'
import { FarmTokens } from './FarmTokens.js'
import { getHiddenTokenSize, HiddenTokens } from './HiddenTokens.js'

const StandContents = () => (
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

const Paleo = () => {
  const { wall, floor } = useShapeContext()
  return (
    <entity name="paleo">
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <Box />
      <StandContents />
      <translate by={{ y: DIMS.cards.a.x + 10 }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>
      <translate by={{ x: MAMMOTH_SKULL_BOX_SIZE.y, y: DIMS.cards.a.x + 11, z: getBigTokenMainSize(floor).z }}>
        <rotate by={{ z: Math.PI / 2 }}>
          <MammothSkullBox />
        </rotate>
      </translate>
      <translate by={{ x: DIMS.box.x, y: getBigTokenThinSize(floor).x }}>
        <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
          <BigTokenThin />
        </rotate>
      </translate>
      <translate by={{ x: DIMS.box.x - getBigTokenThinSize(floor).z - 0.5, y: DIMS.box.y }}>
        <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
          <HiddenTokens />
        </rotate>
      </translate>
      <translate by={{ x: DIMS.box.x - getBigTokenThinSize(floor).z - getHiddenTokenSize(floor).z - 1, y: DIMS.box.y }}>
        <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
          <FarmTokens />
        </rotate>
      </translate>
      <translate by={{ y: DIMS.cards.a.x + 11 }}>
        <BigTokenMain />
      </translate>
    </entity>
  )
}

const PaleoDev = () => (
  <entity name="paleoDev">
    <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
    <HiddenTokens />
  </entity>
)

renderComponent(<Paleo />, {
  // filter: (s) => s.type !== ShapeType.Lid,
}).catch(logger.error)
