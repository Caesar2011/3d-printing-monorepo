import { Cuboid, Cylinder, Edge, useShapeContext } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'
import { range } from '@jsxcad/utils'

import { DIMS } from './constants.js'

const EXTRA_SPACE_TOP = 1.5
const EXTRA_SPACE_SIDE = 1
const WALL = 3
const LID = 2.6

export const getHiddenTokenSize = (floor: number) => {
  return V({
    x: 175,
    y: WALL * 2 + EXTRA_SPACE_SIDE * 2 + DIMS.hiddenTokens.h2.x,
    z: floor * 2 + DIMS.hiddenTokens.h2.z + EXTRA_SPACE_TOP,
  })
}

export const LongToken = ({ token }: { token: keyof typeof DIMS.hiddenTokens }) => (
  <rotate
    by={{ z: Math.PI / 2 }}
    center={{ xy: DIMS.hiddenTokens[token].y / 2 }}
    name={`Content_${token}`}
    type={ShapeType.Content}
  >
    <Cuboid size={DIMS.hiddenTokens[token]} radius={3} edges={Edge.SIDE} />
  </rotate>
)

export const HiddenTokens = () => {
  const { floor } = useShapeContext()
  const size = getHiddenTokenSize(floor)
  const token4Start = DIMS.hiddenTokens.h2.y * 2 + WALL * 3 + EXTRA_SPACE_SIDE * 5
  const token6End = size.x - (DIMS.hiddenTokens.h2.y + WALL * 2 + EXTRA_SPACE_SIDE * 3)
  const midPillarSize = V({
    xy: token6End - token4Start - DIMS.hiddenTokens.h5.x * 2 - EXTRA_SPACE_SIDE * 2,
    z: size.z - LID,
  })
  return (
    <entity name={'hiddenTokens'}>
      <union>
        <subtract>
          <pick typeWhitelist={[ShapeType.Part]}>
            <ClosedContainer
              size={size}
              lid={{ type: 'slide' }}
              wall={WALL}
              //divisions={{ at: [0.158, 0.316, 0.46, 0.58, 0.7, 1 - 0.158] }}
              divisions={{ at: [0.15, 0.3, 1 - 0.15] }}
            />
          </pick>
          <translate by={{ xy: WALL + EXTRA_SPACE_SIDE, y: 15, z: floor }}>
            <Cuboid size={{ x: size.x - (WALL + EXTRA_SPACE_SIDE) * 2, y: 30, z: size.z - floor - LID }} />
          </translate>
        </subtract>
        {range(3).map((idx) => {
          const xOffset = (token6End - token4Start - DIMS.hiddenTokens.h5.x) / 2
          const x = token4Start + xOffset * idx + (DIMS.hiddenTokens.h5.x - midPillarSize.x) / 2
          const y = WALL + EXTRA_SPACE_SIDE * 2 + DIMS.hiddenTokens.h5.y
          const by = V({
            x: x,
            y: idx === 1 ? size.y - y - midPillarSize.y : y,
          })
          return (
            <translate by={by}>
              <Cylinder size={midPillarSize} />
            </translate>
          )
        })}
      </union>
      <translate by={{ xy: WALL + EXTRA_SPACE_SIDE, z: floor }}>
        <LongToken token={'h2'} />
        <translate by={{ x: DIMS.hiddenTokens.h2.y + WALL + EXTRA_SPACE_SIDE * 2 }}>
          <LongToken token={'h3'} />
        </translate>
      </translate>
      <translate by={{ x: token4Start, y: WALL + EXTRA_SPACE_SIDE, z: floor }}>
        <Cylinder size={DIMS.hiddenTokens.h4} type={ShapeType.Content} name={'Content_h4'} />
      </translate>
      <translate
        by={{
          x: (token6End + token4Start - DIMS.hiddenTokens.h5.x) / 2,
          y: size.y - WALL - EXTRA_SPACE_SIDE - DIMS.hiddenTokens.h5.y,
          z: floor,
        }}
      >
        <Cylinder size={DIMS.hiddenTokens.h5} type={ShapeType.Content} name={'Content_h5'} />
      </translate>
      <translate by={{ x: token6End - DIMS.hiddenTokens.h6.x, y: WALL + EXTRA_SPACE_SIDE, z: floor }}>
        <Cylinder size={DIMS.hiddenTokens.h6} type={ShapeType.Content} name={'Content_h6'} />
      </translate>
      <translate
        by={{ x: size.x - WALL - EXTRA_SPACE_SIDE - DIMS.hiddenTokens.h7.y, y: WALL + EXTRA_SPACE_SIDE, z: floor }}
      >
        <LongToken token={'h7'} />
      </translate>
      <pick typeWhitelist={[ShapeType.Lid]}>
        <ClosedContainer size={size} lid={{ type: 'slide' }} wall={WALL} />
      </pick>
    </entity>
  )
}
