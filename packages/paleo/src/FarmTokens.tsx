import { Cuboid, Cylinder, useShapeContext } from '@jsxcad/game'
import { ShapeType, V } from '@jsxcad/core'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'

import { DIMS } from './constants.js'

const EXTRA_SPACE_TOP = 1.5
const EXTRA_SPACE_SIDE = 1
const WALL = 3

const MAX_MIDDLE_X = Math.max(
  DIMS.farmTokens.base.x,
  DIMS.farmTokens.heal.y + DIMS.farmTokens.scythe.y + DIMS.farmTokens.millstone.y + EXTRA_SPACE_SIDE * 4 + WALL * 2,
)

export const getFarmTokenSize = (floor: number) => {
  return V({
    x: WALL * 4 + EXTRA_SPACE_SIDE * 6 + MAX_MIDDLE_X + DIMS.farmTokens.gate.y + DIMS.farmTokens.stone.x,
    y: WALL * 2 + EXTRA_SPACE_SIDE * 2 + DIMS.farmTokens.scythe.x,
    z: floor * 2 + DIMS.farmTokens.gate.z + EXTRA_SPACE_TOP,
  })
}

export const FarmTokens = () => {
  const { floor } = useShapeContext()
  const size = getFarmTokenSize(floor)
  return (
    <entity name={'farmTokens'}>
      <subtract>
        <pick typeWhitelist={[ShapeType.Part]}>
          <ClosedContainer
            size={size}
            lid={{ type: 'slide' }}
            wall={WALL}
            divisions={{ at: [0.3, 0.475, 0.66, 0.83] }}
          />
        </pick>
        <translate by={{ x: 40, y: WALL, z: floor + DIMS.farmTokens.millstone.z * 2 + EXTRA_SPACE_TOP / 4 }}>
          <Cuboid size={{ x: 40, y: size.y - WALL * 2, z: size.z }} />
        </translate>
        <translate by={{ x: 40, y: (size.y - (DIMS.farmTokens.millstone.y - 10)) / 2, z: floor }}>
          <Cuboid size={{ x: 70, y: DIMS.farmTokens.millstone.y - 10, z: size.z }} />
        </translate>
      </subtract>
      <translate by={{ xy: WALL + EXTRA_SPACE_SIDE, z: floor }}>
        <rotate by={{ z: -Math.PI / 2 }} center={{ xy: DIMS.farmTokens.millstone.x / 2 }}>
          <Cylinder size={DIMS.farmTokens.millstone} type={ShapeType.Content} name={'Content_millstone'} />
        </rotate>
        <translate
          by={{ z: DIMS.farmTokens.millstone.z * 2 + EXTRA_SPACE_TOP / 2 }}
          type={ShapeType.Content}
          name={'Content_base'}
        >
          <Cuboid size={DIMS.farmTokens.base} />
        </translate>

        <translate by={{ x: MAX_MIDDLE_X + EXTRA_SPACE_SIDE * 2 + WALL }}>
          <entity type={ShapeType.Content} name={'Content_gate'}>
            <rotate by={{ z: Math.PI / 2 }} center={{ xy: DIMS.farmTokens.gate.y / 2 }}>
              <Cuboid size={DIMS.farmTokens.gate} />
            </rotate>
          </entity>
          <translate by={{ x: -WALL - EXTRA_SPACE_SIDE * 2 - DIMS.farmTokens.heal.y }}>
            <entity type={ShapeType.Content} name={'Content_heal'}>
              <rotate by={{ z: Math.PI / 2 }} center={{ xy: DIMS.farmTokens.heal.y / 2 }}>
                <Cuboid size={DIMS.farmTokens.heal} />
              </rotate>
            </entity>

            <translate by={{ x: -WALL - EXTRA_SPACE_SIDE * 2 - DIMS.farmTokens.scythe.y }}>
              <entity type={ShapeType.Content} name={'Content_scythe'}>
                <rotate by={{ z: Math.PI / 2 }} center={{ xy: DIMS.farmTokens.scythe.y / 2 }}>
                  <Cuboid size={DIMS.farmTokens.scythe} />
                </rotate>
              </entity>
            </translate>
          </translate>
          <translate by={{ x: DIMS.farmTokens.gate.y + EXTRA_SPACE_SIDE * 2 + WALL }}>
            <Cylinder size={DIMS.farmTokens.stone.m({ z: 2 / 5 })} type={ShapeType.Content} name={'Content_stone2'} />
            <translate by={{ y: DIMS.farmTokens.stone.y + EXTRA_SPACE_SIDE * 2 + WALL }}>
              <Cylinder size={DIMS.farmTokens.stone.m({ z: 3 / 5 })} type={ShapeType.Content} name={'Content_stone3'} />
            </translate>
          </translate>
        </translate>
      </translate>
      <pick typeWhitelist={[ShapeType.Lid]}>
        <ClosedContainer size={size} lid={{ type: 'slide' }} wall={WALL} divisions={{ at: [0.3, 0.475, 0.66, 0.83] }} />
      </pick>
    </entity>
  )
}
