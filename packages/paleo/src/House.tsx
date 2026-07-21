import { Cylinder } from '@jsxcad/game'
import { Colors, ShapeType } from '@jsxcad/core'

import { DIMS } from './constants.js'

const Roof1 = () => (
  <translate by={{ xz: DIMS.house.height }}>
    <rotate by={{ y: -Math.PI / 2 }}>
      <prism
        height={DIMS.house.height.x}
        points={[
          { x: -DIMS.house.roofHeight, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: DIMS.house.height.y / 2 },
        ]}
      />
    </rotate>
  </translate>
)

const Roof2 = () => (
  <rotate by={{ z: Math.PI }} center={DIMS.house.height.d(2)}>
    <Roof1 />
  </rotate>
)

export const House = () => (
  <entity name={'house'} type={ShapeType.Content} color={Colors.BROWN_5}>
    <Cylinder size={DIMS.house.base} />
    <translate by={{ xy: DIMS.house.base.s(DIMS.house.height).d(2), z: DIMS.house.base }}>
      <subtract>
        <Cylinder size={DIMS.house.height} />
        <Roof1 />
        <Roof2 />
      </subtract>
    </translate>
  </entity>
)
