import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'
import { Colors, Cuboid } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'

import { DIMS } from './constants.js'

const maxSize = DIMS.tokens.skull.max(DIMS.tokens.mammoth)

const WALL = 3
const SIZE = V({ x: 3, y: 125, xz: maxSize.a(WALL * 2 + 1) })
const SPLIT = (DIMS.tokens.skull.x + WALL) / (DIMS.tokens.mammoth.y + DIMS.tokens.skull.x)

export const MammothSkullBox = () => {
  return (
    <entity name={'mammothskull'}>
      <ClosedContainer
        size={SIZE}
        divisions={{ at: [], children: [{ at: [SPLIT] }] }}
        lid={{ type: 'slide' }}
        wall={WALL}
      />
      <translate
        type={ShapeType.Content}
        color={Colors.GREEN_3}
        by={{ x: (SIZE.x - DIMS.tokens.skull.x) / 2, y: WALL + 1, z: WALL + 0.5 }}
      >
        <Cuboid size={DIMS.tokens.skull} />
      </translate>
      <translate
        type={ShapeType.Content}
        color={Colors.GREEN_4}
        by={{ x: (SIZE.x - DIMS.tokens.mammoth.x) / 2, y: SPLIT * SIZE.y + WALL * 2 + 2, z: WALL + 0.5 }}
      >
        <Cuboid size={DIMS.tokens.mammoth} />
      </translate>
    </entity>
  )
}
