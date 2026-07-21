import { Cuboid, Cylinder, useContainerContext, useShapeContext } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'

import { DIMS } from './constants.js'
import { logger } from './logger.js'

const EXTRA_SPACE_X = 140 / 4 - DIMS.bigTokens.torch.y
logger.info('EXTRA_SPACE_X', { EXTRA_SPACE_X })
const WALL_X = 3
const EXTRA_SPACE_SIDE = 2.5
const EXTRA_SPACE_TOP = 1.5
const OUTER_PILLAR_RADIUS = 8
const LID_HEIGHT = 2.6

const TOKEN_ORDER: (keyof (typeof DIMS)['bigTokens'])[] = ['raft', 'torch', 'spikes', 'flint', 'fur', 'spear', 'fur']

export const getBigTokenMainSize = (floor: number) =>
  V({
    x:
      DIMS.bigTokens.torch.y * TOKEN_ORDER.length +
      EXTRA_SPACE_X * (TOKEN_ORDER.length - 1) +
      2 * EXTRA_SPACE_SIDE +
      2 * WALL_X,
    y: DIMS.bigTokens.torch.x + 2 * EXTRA_SPACE_SIDE,
    z: DIMS.bigTokens.torch.z + floor + LID_HEIGHT + EXTRA_SPACE_TOP,
  })

const OuterPillars = ({ height }: { height: number }) =>
  range(0, TOKEN_ORDER.length + 1).map((idx) => (
    <translate
      key={idx}
      by={{
        xy: -OUTER_PILLAR_RADIUS,
        x: WALL_X + EXTRA_SPACE_SIDE - EXTRA_SPACE_X / 2 + (DIMS.bigTokens.torch.y + EXTRA_SPACE_X) * idx,
      }}
    >
      <Cylinder size={{ xy: OUTER_PILLAR_RADIUS * 2, z: height }} />
    </translate>
  ))

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
    <entity name={'bigTokenMain'}>
      <intersect type={ShapeType.Part}>
        <union>
          <Cuboid size={{ xy: size, z: floor }} />
          <Cuboid size={{ x: WALL_X, y: size, z: size.z - LID_HEIGHT }} />
          <mirror origin={size.d(2)} normal={[1, 0, 0]}>
            <Cuboid size={{ x: WALL_X, y: size, z: size.z - LID_HEIGHT }} />
          </mirror>
          <OuterPillars height={size.z - LID_HEIGHT} />
          <mirror origin={size.d(2)} normal={[0, 1, 0]}>
            <OuterPillars height={size.z - LID_HEIGHT} />
          </mirror>
          <intersect>
            <pick typeWhitelist={[ShapeType.Part]}>
              <ClosedContainer size={size} lid={{ type: 'slide' }} wall={3} />
            </pick>
            <translate by={{ z: size.z - LID_HEIGHT }}>
              <Cuboid size={{ xy: size, z: LID_HEIGHT }} />
            </translate>
          </intersect>
        </union>
        <Cuboid size={size} radius={radius} edges={edges} />
      </intersect>
      {TOKEN_ORDER.map((token, idx) => {
        let size = DIMS.bigTokens[token]
        let name: string = token
        if (token === 'fur') {
          size = size.m({ z: idx !== TOKEN_ORDER.length - 1 ? 5 / 9 : 4 / 9 })
          name = idx !== TOKEN_ORDER.length - 1 ? 'fur5' : 'fur4'
        }
        return (
          <translate
            key={name}
            by={{
              x: EXTRA_SPACE_SIDE + WALL_X + (DIMS.bigTokens.torch.y + EXTRA_SPACE_X) * idx,
              y: EXTRA_SPACE_SIDE,
              z: floor,
            }}
          >
            <Cylinder name={name} type={ShapeType.Content} size={{ x: size.y, y: size.x, z: size }} />
          </translate>
        )
      })}
      <pick typeWhitelist={[ShapeType.Lid]}>
        <ClosedContainer size={size} lid={{ type: 'slide' }} wall={3} />
      </pick>
    </entity>
  )
}
