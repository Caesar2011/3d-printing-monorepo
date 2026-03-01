import { ShapeType } from '@jsxcad/core'
import { Colors, Cuboid } from '@jsxcad/game'

import { DIMS } from './constants.js'

export const Box = () => (
  <subtract name={'outer'} type={ShapeType.Technical} color={Colors.GRAY_5}>
    <translate by={{ xy: -1 }}>
      <Cuboid size={DIMS.box.a({ xy: 2 })} />
    </translate>
    <Cuboid size={DIMS.box} />
  </subtract>
)
