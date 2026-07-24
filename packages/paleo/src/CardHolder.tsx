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
  DIMS.cards.k,
  DIMS.cards.l,
  DIMS.cards.m,
  DIMS.cards.n,
  DIMS.cards.o,
  DIMS.cards.p,
  DIMS.cards.q,
  DIMS.cards.r,
  DIMS.cards.s,
  DIMS.cards.t,
  DIMS.cards.u,
]

const EXCLUSIONS = [1, 2, 5, 8, 10]

export const getCardHolderSize = () => V({ x: DIMS.cards.a.x + 6, y: 268, z: DIMS.cards.a.y + 10 })

export const CardHolder = () => (
  <entity name={'cards'}>
    <CardContainer
      size={getCardHolderSize()}
      dividers={range(CONTENT_SIZES.length + EXCLUSIONS.length - 1).filter((i) => !EXCLUSIONS.includes(i))}
      dividerSpacingMin={6.5}
      contentSizes={CONTENT_SIZES.map((size) => (size !== undefined ? V([size.x, size.z, size.y]) : undefined))}
    />
  </entity>
)
