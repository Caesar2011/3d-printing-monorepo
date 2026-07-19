import { Cuboid, useShapeContext } from '@jsxcad/game'
import { V } from '@jsxcad/core'

import { DIMS } from './constants.js'
import { logger } from './logger.js'

export const getBigTokenThinSize = (wall: number) =>
  V({
    y: DIMS.bigTokens.rope.x * 6 + 7 * 5 + wall * 2 + 2 * 5,
    z: DIMS.bigTokens.rope.y * 2 + wall * 2 + 2 * 5,
    x: DIMS.bigTokens.rope.z + wall * 2 + 1.5,
  })

export const BigTokenThin = () => {
  const { wall } = useShapeContext()
  logger.info('dims', getBigTokenThinSize(wall))
  return <Cuboid size={getBigTokenThinSize(wall)} />
}
