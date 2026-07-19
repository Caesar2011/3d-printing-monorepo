import { Colors, Cuboid } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core/dist/Shape.js'

import { DIMS } from './constants.js'

const LowerBarCut = () => (
  <translate by={{ x: DIMS.stand.lowerBar, z: DIMS.stand.lowerBar.z / 2 }}>
    <rotate by={{ y: -Math.PI / 2 }}>
      <prism
        height={DIMS.stand.lowerBar.x}
        points={[
          { x: -DIMS.stand.lowerBar.z / 2, y: 0 },
          { x: -DIMS.stand.lowerBar.z / 2, y: DIMS.stand.lowerBar.y },
          { x: 0, y: DIMS.stand.lowerBar.y },
        ]}
      />
    </rotate>
  </translate>
)

export const Stand = () => (
  <entity name={'stand'} type={ShapeType.Content} color={Colors.BROWN_1}>
    <union>
      <translate by={{ z: DIMS.stand.lowerBarOffset }}>
        <intersect>
          <Cuboid size={DIMS.stand.lowerBar} />
          <LowerBarCut />
        </intersect>
      </translate>
      <translate by={{ yz: DIMS.stand.size.s(DIMS.stand.upperBar) }}>
        <Cuboid size={DIMS.stand.upperBar} />
      </translate>
      <translate by={{ x: DIMS.stand.outerSpace }}>
        <Cuboid
          size={{
            x: DIMS.stand.cardBoardWidth,
            yz: DIMS.stand.size,
          }}
        />
      </translate>
      <translate by={{ x: DIMS.stand.size.x - DIMS.stand.outerSpace - DIMS.stand.cardBoardWidth }}>
        <Cuboid
          size={{
            x: DIMS.stand.cardBoardWidth,
            yz: DIMS.stand.size,
          }}
        />
      </translate>
    </union>
  </entity>
)
