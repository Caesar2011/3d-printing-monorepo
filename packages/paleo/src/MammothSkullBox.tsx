import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'
import { Colors, Cuboid } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'

import { DIMS } from './constants.js'

const maxSize = DIMS.tokens.skull.max(DIMS.tokens.mammoth)

const WALL = 3
export const MAMMOTHSKULL_SIZE = V({ x: 3, y: 125, xz: maxSize.a(WALL * 2 + 1) })
const SPLIT = (DIMS.tokens.skull.x + WALL) / (DIMS.tokens.mammoth.y + DIMS.tokens.skull.x)

export const MammothSkullBox = () => {
  return (
    <entity name={'mammothskull'}>
      <ClosedContainer
        size={MAMMOTHSKULL_SIZE}
        divisions={{ at: [], children: [{ at: [SPLIT] }] }}
        lid={{ type: 'slide' }}
        wall={WALL}
      />
      <translate
        type={ShapeType.Content}
        color={Colors.GREEN_3}
        name={'skull'}
        by={{ x: (MAMMOTHSKULL_SIZE.x - DIMS.tokens.skull.x) / 2, y: WALL + 1, z: WALL + 0.5 }}
      >
        <Cuboid size={DIMS.tokens.skull} />
      </translate>
      <translate
        type={ShapeType.Content}
        color={Colors.GREEN_4}
        name={'mammoth'}
        by={{
          x: (MAMMOTHSKULL_SIZE.x - DIMS.tokens.mammoth.x) / 2,
          y: SPLIT * MAMMOTHSKULL_SIZE.y + WALL * 2 + 2,
          z: WALL + 0.5,
        }}
      >
        <Cuboid size={DIMS.tokens.mammoth} />
      </translate>
    </entity>
  )
}
