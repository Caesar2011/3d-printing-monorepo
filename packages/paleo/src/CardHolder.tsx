import { CardContainer } from '@jsxcad/game/dist/card-container/CardContainer.js'
import { V } from '@jsxcad/core'
import { range } from '@jsxcad/utils'

import { DIMS } from './constants.js'

const CONTENT_SIZES = [
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
]

const EXCLUSIONS = [0, 2, 7, 9]

export const CardHolder = () => (
  <entity name={'cards'}>
    <CardContainer
      size={{ x: DIMS.cards.a.x, y: 260, z: DIMS.cards.a.y, xyz: 10 }}
      dividers={range(CONTENT_SIZES.length + EXCLUSIONS.length).filter((i) => !EXCLUSIONS.includes(i))}
      dividerSpacingMin={6.5}
      contentSizes={CONTENT_SIZES.map((size) => (size !== undefined ? V([size.x, size.z, size.y]) : undefined))}
    />
  </entity>
)
