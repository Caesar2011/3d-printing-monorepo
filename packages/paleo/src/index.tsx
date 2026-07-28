import * as path from 'node:path'

import { DebugAxes, renderComponent } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core'

import { logger } from './logger.js'
import { DIMS } from './constants.js'
import { Box, BOX_OUTER_SIZE } from './Box.js'
import { CardHolder } from './CardHolder.js'
import {
  DrawPilesPlate,
  FarmBasePlate,
  GraveyardBasePlate,
  GraveyardHeightPlate,
  MamoothSkullPlate,
  ResourcesPlate,
} from './Plates.js'
import { House } from './House.js'
import { Stand } from './Stand.js'
import { BigTokenThin } from './BigTokenThin.js'
import { BigTokenMain } from './BigTokenMain.js'
import { FarmTokens } from './FarmTokens.js'
import { HiddenTokens } from './HiddenTokens.js'
import { MammothSkullBox } from './MammothSkullBox.js'
import { BuildResources, FoodResources, LifeResources } from './Resources.js'

export const Paleo = () => {
  const gap = 1
  const BOX_ALIGNMENT = BOX_OUTER_SIZE
  return (
    <entity name="paleo">
      <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
      <layout gap={gap}>
        <layoutItem id="box">
          <Box />
        </layoutItem>
        {/* ---------- STAND ---------- */}
        <layoutItem id="stand" layout={[{ y: 'box', align: 'end', gap: BOX_ALIGNMENT }]}>
          <Stand />
        </layoutItem>
        <layoutItem
          id="farmBase"
          layout={[
            { x: 'stand', align: 'center' },
            { y: 'stand', align: 'start' },
          ]}
        >
          <FarmBasePlate />
        </layoutItem>
        <layoutItem
          id="graveyardBase"
          layout={[{ x: 'farmBase', align: 'start' }, { y: 'stand', align: 'start' }, { z: 'farmBase' }]}
        >
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
          layout={[
            { x: 'farmBase', align: 'start' },
            { y: 'graveyardHeight', align: 'start' },
            { z: 'graveyardHeight' },
          ]}
        >
          <House />
        </layoutItem>
        {/* ---------- CARDS ---------- */}
        <layoutItem id={'cardHolder'} layout={[{ y: 'box', align: 'start', gap: BOX_ALIGNMENT }]}>
          <rotate by={{ z: -Math.PI / 2 }}>
            <CardHolder />
          </rotate>
        </layoutItem>
        {/* ---------- MIDDLE ---------- */}
        <layoutItem id={'big-token-main'} layout={[{ x: 'cardHolder', align: 'start' }, { y: 'cardHolder' }]}>
          <BigTokenMain />
        </layoutItem>
        <layoutItem
          id={'mammoth-skull'}
          layout={[{ x: 'house' }, { x: 'graveyardHeight' }, { y: 'house', align: 'center' }, { z: 'graveyardBase' }]}
        >
          <rotate by={{ z: Math.PI / 2 }}>
            <MammothSkullBox />
          </rotate>
        </layoutItem>
        {/* ---------- RIGHT ---------- */}
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
          id={'hiddenTokens'}
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
          id={'farmTokens'}
          layout={[
            { x: 'hiddenTokens', align: 'before' },
            { y: 'stand', align: 'end' },
          ]}
        >
          <rotate by={{ x: Math.PI / 2, z: -Math.PI / 2 }}>
            <FarmTokens />
          </rotate>
        </layoutItem>
        {/* ---------- RESOURCES ---------- */}
        <layoutItem
          id={'food'}
          layout={[{ x: 'stand', align: 'center' }, { y: 'cardHolder' }, { z: 'big-token-main' }]}
        >
          <rotate by={{ x: Math.PI / 2 }}>
            <FoodResources />
          </rotate>
        </layoutItem>
        <layoutItem
          id={'build'}
          layout={[{ x: 'food', align: 'start' }, { y: 'food', gap: 0.5 }, { z: 'big-token-main' }]}
        >
          <rotate by={{ x: Math.PI / 2 }}>
            <BuildResources />
          </rotate>
        </layoutItem>
        <layoutItem id={'life'} layout={[{ x: 'food', align: 'start' }, { y: 'build' }, { z: 'build', align: 'end' }]}>
          <LifeResources />
        </layoutItem>
        {/* ---------- TOP PLATES ---------- */}
        <layoutItem
          id={'plateDraw'}
          layout={[{ z: 'cardHolder' }, { z: 'life' }, { z: 'farmTokens', gap: 0 }, { z: 'hiddenTokens' }]}
        >
          <DrawPilesPlate />
        </layoutItem>
        <layoutItem id={'plateRes'} layout={[{ z: 'plateDraw', gap: 0 }]}>
          <ResourcesPlate />
        </layoutItem>
        <layoutItem id={'plateMammoth'} layout={[{ z: 'plateRes', gap: 0 }]}>
          <MamoothSkullPlate />
        </layoutItem>
      </layout>
    </entity>
  )
}

const PaleoDev = () => (
  <entity name="paleoDev">
    <DebugAxes x={DIMS.box.x} y={DIMS.box.y} z={DIMS.box.z} />
    <pick typeBlacklist={[ShapeType.Lid]}>
      <BuildResources />
      <translate by={{ y: 70 }}>
        <LifeResources />
      </translate>
      <translate by={{ y: 140 }}>
        <FoodResources />
      </translate>
    </pick>
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
