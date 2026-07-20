import { Cuboid, useContainerContext, useShapeContext } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'

import { DIMS } from './constants.js'
import { logger } from './logger.js'

const EXTRA_SPACE_X = 140 / 4 - DIMS.bigTokens.torch.y
logger.info('EXTRA_SPACE_X', { EXTRA_SPACE_X })
const EXTRA_SPACE_SIDE = 2.5
const EXTRA_SPACE_TOP = 1.5
const MIDDLE_PILLAR_RADIUS = 4
const OUTER_PILLAR_RADIUS = 10
const LID_HEIGHT = 2.6

const TOKEN_ORDER: (keyof (typeof DIMS)['bigTokens'])[] = ['raft', 'torch', 'spikes', 'flint', 'fur', 'spear', 'fur']

export const getBigTokenMainSize = (floor: number) =>
  V({
    x: DIMS.bigTokens.torch.y * TOKEN_ORDER.length + EXTRA_SPACE_X * (TOKEN_ORDER.length - 1) + 2 * EXTRA_SPACE_SIDE,
    y: DIMS.bigTokens.torch.x + 2 * EXTRA_SPACE_SIDE,
    z: DIMS.bigTokens.torch.z + floor + LID_HEIGHT + EXTRA_SPACE_TOP,
  })

export const BigTokenMain = () => {
  const { floor } = useShapeContext()
  const { radius, edges } = useContainerContext()
  const size = getBigTokenMainSize(floor)
  logger.info('dims', size)
  if (TOKEN_ORDER[0].length !== TOKEN_ORDER[0].length) {
    throw new Error(
      `In BigTokenThin TOKEN_ORDER[0] (${TOKEN_ORDER[0]}) must be larger by 1 then TOKEN_ORDER[1] (${TOKEN_ORDER[1]}).`,
    )
  }
  return (
    <entity type={ShapeType.Part}>
      <Cuboid size={size} />
    </entity>
  )
}
