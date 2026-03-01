import { Colors, Cuboid } from '@jsxcad/game'
import { ShapeType } from '@jsxcad/core/dist/Shape.js'

import { DIMS } from './constants.js'

export const Stand = () => (
  <entity name={'stand'} type={ShapeType.Content} color={Colors.BROWN_1}>
    <union>
      <Cuboid size={DIMS.stand.lowerBar} />
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
