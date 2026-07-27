import { Colors, ShapeType } from '@jsxcad/core'
import { Cuboid } from '@jsxcad/game'

import { DIMS } from './constants.js'

export const BOX_OUTER_SIZE = 1

export const Box = () => (
  <subtract name={'outer'} type={ShapeType.Technical} color={Colors.GRAY_5}>
    <translate by={{ xy: -1 * BOX_OUTER_SIZE }}>
      <Cuboid size={DIMS.box.a({ xy: 2 * BOX_OUTER_SIZE })} />
    </translate>
    <Cuboid size={DIMS.box} />
  </subtract>
)
