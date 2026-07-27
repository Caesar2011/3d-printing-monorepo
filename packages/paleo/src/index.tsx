import * as path from 'node:path'

import { DebugAxes, renderComponent } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { MammothSkullBox } from './MammothSkullBox.js'
import { Box, BOX_OUTER_SIZE } from './Box.js'
import { CardHolder } from './CardHolder.js'
import { FarmBasePlate, GraveyardBasePlate, GraveyardHeightPlate } from './Plates.js'
import { House } from './House.js'
import { Stand } from './Stand.js'
import { BigTokenThin } from './BigTokenThin.js'
import { BigTokenMain } from './BigTokenMain.js'
import { FarmTokens } from './FarmTokens.js'
import { HiddenTokens } from './HiddenTokens.js'

const StandContents = () => (
  <translate>
    <layout gap={1}>
      <layoutItem id="stand">
        <Stand />
      </layoutItem>
      <layoutItem id="farmBase" layout={[{ x: 'stand', align: 'center' }]}>
        <FarmBasePlate />
      </layoutItem>
      <layoutItem id="graveyardBase" layout={[{ x: 'farmBase', align: 'start' }, { z: 'farmBase' }]}>
        <GraveyardBasePlate />
      </layoutItem>
      <layoutItem
        id="graveyardHeight"
        layout={[
          { x: 'farmBase', align: 'start' },
          { y: 'stand', align: 'start', gap: DIMS.stand.lowerBar.y - 13 },
          { z: 'graveyardBase' },
        ]}
      >
        <GraveyardHeightPlate />
      </layoutItem>
      <layoutItem
        id="house"
        layout={[{ x: 'farmBase', align: 'start' }, { y: 'graveyardHeight', align: 'start' }, { z: 'graveyardHeight' }]}
      >
        <House />
      </layoutItem>
    </layout>
  </translate>
)

const Paleo = () => {
  const gap = 1
  const BOX_ALIGNMENT = BOX_OUTER_SIZE
  return (
    <entity name="paleo">
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <layout gap={gap}>
        <layoutItem id="box">
          <Box />
        </layoutItem>
        <layoutItem id={'stand'} layout={[{ y: 'box', align: 'end', gap: BOX_ALIGNMENT }]}>
          <StandContents />
        </layoutItem>
        <layoutItem id={'card-holder'} layout={[{ y: 'box', align: 'start', gap: BOX_ALIGNMENT }]}>
          <rotate by={{ z: -Math.PI / 2 }}>
            <CardHolder />
          </rotate>
        </layoutItem>
        <layoutItem id={'big-token-main'} layout={[{ x: 'card-holder', align: 'start' }, { y: 'card-holder' }]}>
          <BigTokenMain />
        </layoutItem>
        <layoutItem
          id={'mammoth-skull'}
          layout={[{ x: 'card-holder', align: 'start' }, { y: 'card-holder' }, { z: 'big-token-main' }]}
        >
          <rotate by={{ z: Math.PI / 2 }}>
            <MammothSkullBox />
          </rotate>
        </layoutItem>
        <layoutItem
          id={'big-token-thin'}
          layout={[
            { x: 'box', align: 'end', gap: BOX_ALIGNMENT },
            { y: 'stand', align: 'end' },
          ]}
        >
          <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
            <BigTokenThin />
          </rotate>
        </layoutItem>
        <layoutItem
          id={'hidden-tokens'}
          layout={[
            { x: 'big-token-thin', align: 'before' },
            { y: 'stand', align: 'end' },
          ]}
        >
          <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
            <HiddenTokens />
          </rotate>
        </layoutItem>
        <layoutItem
          id={'farm-tokens'}
          layout={[
            { x: 'hidden-tokens', align: 'before' },
            { y: 'stand', align: 'end' },
          ]}
        >
          <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
            <FarmTokens />
          </rotate>
        </layoutItem>
      </layout>
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
  repeat: 3,
}).catch(logger.error)
