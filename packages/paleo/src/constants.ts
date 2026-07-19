import { V } from '@jsxcad/core'

const card = V([87.2, 56.1, 50.5 / 171])

export const DIMS = {
  box: V([288, 288, 70]),
  cards: {
    // base
    a: card.m({ z: 9 }),
    b: card.m({ z: 11 }),
    c: card.m({ z: 10 }),
    d: card.m({ z: 11 }),
    e: card.m({ z: 12 }),
    f: card.m({ z: 17 }),
    g: card.m({ z: 15 }),
    h: card.m({ z: 14 }),
    i: card.m({ z: 11 }),
    j: card.m({ z: 14 }),
    quest: card.m({ z: 22 + 8 }),
    recipes: card.m({ z: 8 + 3 }),
    dream: card.m({ z: 16 + 5 }),
    people: card.m({ z: 20 }),
    base: card.m({ z: 32 }),
    extra: card.m({ z: 18 }),
    // expansion
    m: card.m({ z: 12 }),
    n: card.m({ z: 18 }),
    o: card.m({ z: 18 }),
    p: card.m({ z: 17 }),
    q: card.m({ z: 20 }),
    r: card.m({ z: 15 }),
    peopleE: card.m({ z: 20 }),
    baseE: card.m({ z: 35 }),
    extraE: card.m({ z: 9 }),
    // add-ons
    // TODO
  },
  stand: {
    size: V([250, 143, 67]),
    lowerBar: V([250, 40, 40]),
    upperBar: V([250, 40, 35]),
    outerSpace: 15,
    cardBoardWidth: 2,
  },
  tokens: {
    mammoth: V([34, 74, 11]),
    skull: V([26, 30, 11]),
  },
}
