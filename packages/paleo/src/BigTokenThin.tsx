import { Cuboid, Cylinder, Fillet, useContainerContext, useShapeContext } from '@jsxcad/game'
import { Colors, ShapeType, V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'

import { DIMS } from './constants.js'

const EXTRA_SPACE_X = 7
const EXTRA_SPACE_SIDE = 2.5
const EXTRA_SPACE_TOP = 1.5
const INSET_SPACE = -4
const MIDDLE_PILLAR_RADIUS = 4
const OUTER_PILLAR_RADIUS = 10
const LID_HEIGHT = 2.6

const TOKEN_ORDER_ORG: [(keyof (typeof DIMS)['bigTokens'])[], (keyof (typeof DIMS)['bigTokens'])[]] = [
  ['rope', 'shell', 'root', 'shirt', 'bow', 'flute'],
  ['feather', 'hammer', 'decor', 'tent', 'wolf'],
]

const TOKEN_ORDER: [(keyof (typeof DIMS)['bigTokens'])[], (keyof (typeof DIMS)['bigTokens'])[]] = [
  ['rope', 'shell'],
  ['feather'],
]

export const getBigTokenThinSize = (floor: number) =>
  V({
    x:
      DIMS.bigTokens.rope.x * TOKEN_ORDER[0].length +
      EXTRA_SPACE_X * (TOKEN_ORDER[0].length - 1) +
      2 * EXTRA_SPACE_SIDE,
    y: DIMS.bigTokens.rope.y * 2 + 2 * EXTRA_SPACE_SIDE + INSET_SPACE,
    z: DIMS.bigTokens.rope.z + floor + LID_HEIGHT + EXTRA_SPACE_TOP,
  })

const InnerPillars = () => {
  const { floor } = useShapeContext()
  const size = getBigTokenThinSize(floor)
  return range(-1, TOKEN_ORDER.flat().length + 1).map((idx) => {
    const innerY = EXTRA_SPACE_SIDE + DIMS.bigTokens.rope.y
    return (
      <translate
        key={idx}
        by={{
          x:
            EXTRA_SPACE_X * (idx / 2) +
            EXTRA_SPACE_SIDE +
            DIMS.bigTokens.rope.x * (idx / 2 + 0.5) -
            MIDDLE_PILLAR_RADIUS,
          y: idx % 2 === 0 ? innerY : size.y - innerY - 2 * MIDDLE_PILLAR_RADIUS,
        }}
      >
        <Cylinder size={{ xy: MIDDLE_PILLAR_RADIUS * 2, z: size.z - LID_HEIGHT }} />
      </translate>
    )
  })
}

const OuterPillars = () => {
  const { floor } = useShapeContext()
  const size = getBigTokenThinSize(floor)
  return range(-1, TOKEN_ORDER.flat().length + 1).map((idx) => (
    <translate
      key={idx}
      by={{
        x: EXTRA_SPACE_X * (idx / 2) + EXTRA_SPACE_SIDE + DIMS.bigTokens.rope.x * (idx / 2 + 0.5) - OUTER_PILLAR_RADIUS,
        y: (idx % 2 === 0 ? size.y : 0) - OUTER_PILLAR_RADIUS,
      }}
    >
      <Cylinder size={{ xy: OUTER_PILLAR_RADIUS * 2, z: size.z - LID_HEIGHT }} />
    </translate>
  ))
}

const LidGuidePillars = () => {
  const { floor } = useShapeContext()
  const size = getBigTokenThinSize(floor)
  const innerY = EXTRA_SPACE_SIDE + DIMS.bigTokens.rope.y + MIDDLE_PILLAR_RADIUS
  return (
    <union>
      <translate by={{ y: size.y - innerY }}>
        <Cuboid
          size={{
            x: MIDDLE_PILLAR_RADIUS - EXTRA_SPACE_X / 2 + EXTRA_SPACE_SIDE,
            y: innerY,
            z: size.z - LID_HEIGHT,
          }}
        />
      </translate>
      <translate by={{ y: size.y - OUTER_PILLAR_RADIUS }}>
        <Cuboid
          size={{ x: EXTRA_SPACE_SIDE + DIMS.bigTokens.rope.x * 0.5, y: OUTER_PILLAR_RADIUS, z: size.z - LID_HEIGHT }}
        />
      </translate>
      <translate
        by={{ x: MIDDLE_PILLAR_RADIUS - EXTRA_SPACE_X / 2 + EXTRA_SPACE_SIDE, y: size.y - OUTER_PILLAR_RADIUS }}
      >
        <rotate by={{ z: -Math.PI / 2 }}>
          <Fillet size={{ xy: MIDDLE_PILLAR_RADIUS, z: size.z - LID_HEIGHT }} />
        </rotate>
      </translate>
    </union>
  )
}

const TokenContents = () => {
  const { floor } = useShapeContext()
  const size = getBigTokenThinSize(floor)
  return (
    <>
      {TOKEN_ORDER[0].map((token, idx) => (
        <entity type={ShapeType.Content} color={Colors.GREEN_1} name={`token_${token}`} key={token}>
          <translate
            by={{
              x: (EXTRA_SPACE_X + DIMS.bigTokens[token].x) * idx + EXTRA_SPACE_SIDE,
              y: EXTRA_SPACE_SIDE,
              z: floor,
            }}
          >
            <Cylinder size={DIMS.bigTokens[token]} />
          </translate>
        </entity>
      ))}
      {TOKEN_ORDER[1].map((token, idx) => (
        <entity type={ShapeType.Content} color={Colors.GREEN_1} name={`token_${token}`} key={token}>
          <translate
            by={{
              x: (EXTRA_SPACE_X + DIMS.bigTokens[token].x) * (idx + 0.5) + EXTRA_SPACE_SIDE,
              y: EXTRA_SPACE_SIDE + DIMS.bigTokens[token].y + INSET_SPACE,
              z: floor,
            }}
          >
            <Cylinder size={DIMS.bigTokens[token]} />
          </translate>
        </entity>
      ))}
    </>
  )
}

export const BigTokenThin = () => {
  const { floor } = useShapeContext()
  const { radius, edges } = useContainerContext()
  const size = getBigTokenThinSize(floor)
  if (TOKEN_ORDER[0].length !== TOKEN_ORDER[1].length + 1) {
    throw new Error(
      `In BigTokenThin TOKEN_ORDER[0] (${TOKEN_ORDER[0]}) must be larger by 1 then TOKEN_ORDER[1] (${TOKEN_ORDER[1]}).`,
    )
  }
  return (
    <entity name={'bigTokenThin'}>
      <intersect type={ShapeType.Part}>
        <union>
          <Cuboid size={{ xy: size, z: floor }} />
          <InnerPillars />
          <OuterPillars />
          <LidGuidePillars />
          <mirror origin={size.d(2)} normal={[1, 0, 0]}>
            <LidGuidePillars />
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
      <TokenContents />
      <pick typeWhitelist={[ShapeType.Lid]}>
        <ClosedContainer size={size} lid={{ type: 'slide' }} wall={3} />
      </pick>
    </entity>
  )
}
