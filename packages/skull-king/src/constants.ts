import { V } from '@jsxcad/core'

const card = V([59.4, 91.2, 35.3 / 120])

export const DIMS = {
  cards: card.m({ z: 120 }),
  rulebook: V([120, 90, 2]),
  scoreNotes: V([120, 90, 6]),
}
