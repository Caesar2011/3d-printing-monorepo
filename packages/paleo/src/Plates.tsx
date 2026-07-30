import { Cuboid } from '@jsxcad/game'
import { Colors, ShapeType } from '@jsxcad/core'

import { DIMS } from './constants.js'

export const GraveyardBasePlate = () => (
  <entity name={'graveyardBasePlate'} type={ShapeType.Content} color={Colors.BROWN_2}>
    <Cuboid size={DIMS.plates.graveyardBase} />
  </entity>
)
export const GraveyardHeightPlate = () => (
  <entity name={'graveyardHeightPlate'} type={ShapeType.Content} color={Colors.BROWN_3}>
    <Cuboid size={DIMS.plates.graveyardHeight} />
  </entity>
)
export const FarmBasePlate = () => (
  <entity name={'farmBasePlate'} type={ShapeType.Content} color={Colors.BROWN_4}>
    <Cuboid size={DIMS.plates.farm} />
  </entity>
)

export const MammothSkullPlate = () => (
  <entity name={'mammothSkullPlate'} type={ShapeType.Content} color={Colors.BROWN_4}>
    <Cuboid size={DIMS.plates.mammothSkull} />
  </entity>
)
export const DrawPilesPlate = () => (
  <entity name={'drawPilesPlate'} type={ShapeType.Content} color={Colors.BROWN_4}>
    <Cuboid size={DIMS.plates.drawPiles} />
  </entity>
)
export const ResourcesPlate = () => (
  <entity name={'resourcesPlate'} type={ShapeType.Content} color={Colors.BROWN_4}>
    <Cuboid size={DIMS.plates.resources} />
  </entity>
)
