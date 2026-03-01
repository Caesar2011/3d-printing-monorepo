import { CardContainer } from '@jsxcad/game/dist/card-container/CardContainer.js'

import { DIMS } from './constants.js'

export const CardHolder = () => (
  <CardContainer
    size={{ x: DIMS.cards.a.x, y: 260, z: DIMS.cards.a.y, xyz: 10 }}
    dividers={'all'}
    dividerSpacingMin={7}
    dividerRadius={2}
  />
)
