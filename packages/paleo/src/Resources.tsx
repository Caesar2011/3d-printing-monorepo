import { Cuboid } from '@jsxcad/game'
import { Colors, V } from '@jsxcad/core'

import { DIMS } from './constants.js'

const BOX_SIZE = V({
  x: 190,
  y: 48,
  z: DIMS.resources.stone.size.x + 5,
})

const TOP_SIZE = V({
  x: 140,
  y: 150,
  z: DIMS.resources.stone.size.x + 5,
})

const MIDDLE_SIZE = V({
  x: 250,
  y: 50,
  z: DIMS.resources.stone.size.x + 5,
})

const FOOD_SPLIT = 115 / 190
const WOOD_SPLIT = 95 / 190
const LIFE_SPLIT = 145 / 190

export const FoodResources = () => {
  return (
    <entity color={Colors.PURPLE_1}>
      <Cuboid size={BOX_SIZE} />
    </entity>
  )
}

export const TopResources = () => {
  return (
    <entity color={Colors.PURPLE_1}>
      <Cuboid size={TOP_SIZE} />
    </entity>
  )
}

export const MiddleResources = () => {
  return (
    <entity color={Colors.PURPLE_2}>
      <Cuboid size={MIDDLE_SIZE} />
    </entity>
  )
}
