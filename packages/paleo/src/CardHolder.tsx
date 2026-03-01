import { CardContainer } from '@jsxcad/game/dist/card-container/CardContainer.js'
import { V } from '@jsxcad/core'

import { DIMS } from './constants.js'

export const CardHolder = () => (
  <CardContainer
    size={{ x: DIMS.cards.a.x, y: 260, z: DIMS.cards.a.y, xyz: 10 }}
    dividers={'all'}
    dividerSpacingMin={7.5}
    dividerRadius={2}
    contentSizes={[
      DIMS.cards.extra.a({ z: DIMS.cards.extraE.z }),
      DIMS.cards.base,
      DIMS.cards.people,
      DIMS.cards.dream,
      DIMS.cards.recipes,
      DIMS.cards.quest,
      DIMS.cards.baseE,
      DIMS.cards.peopleE,
      DIMS.cards.a,
      DIMS.cards.b,
      DIMS.cards.c,
      DIMS.cards.d,
      DIMS.cards.e,
      DIMS.cards.f,
      DIMS.cards.g,
      DIMS.cards.h,
      DIMS.cards.i,
      DIMS.cards.j,
      undefined, // k
      undefined, // l
      DIMS.cards.m,
      DIMS.cards.n,
      DIMS.cards.o,
      DIMS.cards.p,
      DIMS.cards.q,
      DIMS.cards.r,
      undefined, // s
      undefined, // t
      undefined, // u
      undefined,
    ].map((size) => (size !== undefined ? V([size.x, size.z, size.y]) : undefined))}
  />
)
