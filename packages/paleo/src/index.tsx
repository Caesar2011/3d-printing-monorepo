import * as path from 'node:path'

import { DebugAxes, renderComponent, useShapeContext } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MAMMOTH_SKULL_BOX_SIZE, MammothSkullBox } from './MammothSkullBox.js'
import { Box } from './Box.js'
import { CardHolder, getCardHolderSize } from './CardHolder.js'
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
      <translate by={{ y: getCardHolderSize().x }}>
        <rotate by={{ z: -Math.PI / 2 }}>
          <CardHolder />
        </rotate>
      </translate>
      <translate by={{ x: MAMMOTH_SKULL_BOX_SIZE.y, y: getCardHolderSize().x + 1, z: getBigTokenMainSize(floor).z }}>
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
      <translate by={{ y: getCardHolderSize().x + 1 }}>
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

const PaleoExport = () => (
  <pick typeWhitelist={[ShapeType.Part, ShapeType.Lid]}>
    <Paleo />
  </pick>
)

renderComponent(<Paleo />, {
  fileDir: path.join(import.meta.dirname, '../../server'),
  // filter: (s) => s.type !== ShapeType.Lid,
}).catch(logger.error)
