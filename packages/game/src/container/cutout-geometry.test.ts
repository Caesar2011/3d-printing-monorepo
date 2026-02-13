import { describe, expect, test } from 'vitest'
import { V } from '@jsxcad/core'

import { Edge } from '../primitives/Cuboid.js'

import { computeCutoutPlacements, type ResolvedCutout } from './cutout-geometry.js'
import { CutoutType } from './types.js'

const defaultCutout: ResolvedCutout = {
  type: CutoutType.HEX,
  border: 5,
  borderRadius: 2,
  hexInnerDiameter: 8,
  hexWidth: 1.2,
  center: true,
}

const WALL = 1.5
const FLOOR = 2
const SIDE_FL = 0b0000_1000_0000

describe('computeCutoutPlacements', () => {
  describe('bottom cutout', () => {
    test('computes correct size with no corner radius', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        bottom: defaultCutout,
      })

      expect(placements).toHaveLength(1)
      const p = placements[0]

      expect(p.size.x).toBeCloseTo(67)
      expect(p.size.y).toBeCloseTo(47)
      expect(p.size.z).toBeCloseTo(FLOOR)
    })

    test('translation places cutout inside walls with border offset', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        bottom: defaultCutout,
      })

      const p = placements[0]
      expect(p.translation.x).toBeCloseTo(WALL + 5)
      expect(p.translation.y).toBeCloseTo(WALL + 5)
      expect(p.translation.z).toBeCloseTo(0)
    })

    test('accounts for corner radius on bottom edges', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 4, Edge.ALL, {
        bottom: defaultCutout,
      })

      const p = placements[0]
      expect(p.size.x).toBeCloseTo(59)
      expect(p.size.y).toBeCloseTo(39)
    })

    test('returns no placement when too small', () => {
      const placements = computeCutoutPlacements(V([20, 20, 40]), WALL, FLOOR, 4, Edge.ALL, {
        bottom: { ...defaultCutout, border: 20 },
      })
      expect(placements).toHaveLength(0)
    })

    test('no rotation for bottom', () => {
      const placements = computeCutoutPlacements(V([80, 60, 40]), WALL, FLOOR, 0, Edge.NONE, {
        bottom: defaultCutout,
      })
      const r = placements[0].rotation
      expect(r.x).toBeCloseTo(0)
      expect(r.y).toBeCloseTo(0)
      expect(r.z).toBeCloseTo(0)
    })
  })

  describe('front cutout', () => {
    test('width is along X, height is along Z', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        front: defaultCutout,
      })

      expect(placements).toHaveLength(1)
      const p = placements[0]

      expect(p.size.x).toBeCloseTo(67)
      expect(p.size.y).toBeCloseTo(28)
      expect(p.size.z).toBeCloseTo(WALL)
    })

    test('translation places on front wall', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        front: defaultCutout,
      })

      const p = placements[0]
      expect(p.translation.x).toBeCloseTo(WALL + 5)
      expect(p.translation.y).toBeCloseTo(WALL)
      expect(p.translation.z).toBeCloseTo(FLOOR + 5)
    })

    test('rotation is 90° around X', () => {
      const placements = computeCutoutPlacements(V([80, 60, 40]), WALL, FLOOR, 0, Edge.NONE, {
        front: defaultCutout,
      })
      expect(placements[0].rotation.x).toBeCloseTo(Math.PI / 2)
      expect(placements[0].rotation.y).toBeCloseTo(0)
      expect(placements[0].rotation.z).toBeCloseTo(0)
    })
  })

  describe('back cutout', () => {
    test('width is along X, height is along Z', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        back: defaultCutout,
      })

      const p = placements[0]
      expect(p.size.x).toBeCloseTo(67)
      expect(p.size.y).toBeCloseTo(28)
      expect(p.size.z).toBeCloseTo(WALL)
    })

    test('translation places on back wall', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        back: defaultCutout,
      })

      const p = placements[0]
      expect(p.translation.x).toBeCloseTo(WALL + 5)
      expect(p.translation.y).toBeCloseTo(60)
      expect(p.translation.z).toBeCloseTo(FLOOR + 5)
    })
  })

  describe('left cutout', () => {
    test('width is along Y, height is along Z', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        left: defaultCutout,
      })

      const p = placements[0]
      expect(p.size.x).toBeCloseTo(28)
      expect(p.size.y).toBeCloseTo(47)
      expect(p.size.z).toBeCloseTo(WALL)
    })

    test('translation places on left wall', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        left: defaultCutout,
      })

      const p = placements[0]
      expect(p.translation.x).toBeCloseTo(WALL)
      expect(p.translation.y).toBeCloseTo(WALL + 5)
      expect(p.translation.z).toBeCloseTo(FLOOR + 5)
    })
  })

  describe('right cutout', () => {
    test('width is along Y, height is along Z', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        right: defaultCutout,
      })

      const p = placements[0]
      expect(p.size.x).toBeCloseTo(28)
      expect(p.size.y).toBeCloseTo(47)
      expect(p.size.z).toBeCloseTo(WALL)
    })

    test('translation places on right wall', () => {
      const size = V([80, 60, 40])
      const placements = computeCutoutPlacements(size, WALL, FLOOR, 0, Edge.NONE, {
        right: defaultCutout,
      })

      const p = placements[0]
      expect(p.translation.x).toBeCloseTo(80)
      expect(p.translation.y).toBeCloseTo(WALL + 5)
      expect(p.translation.z).toBeCloseTo(FLOOR + 5)
    })
  })

  describe('asymmetric corner radii', () => {
    test('front face with only front-left edge filleted', () => {
      const size = V([80, 60, 40])
      const edges = SIDE_FL as unknown as Edge

      const placements = computeCutoutPlacements(size, WALL, FLOOR, 4, edges, {
        front: { ...defaultCutout, border: 0 },
      })

      const p = placements[0]
      expect(p.size.x).toBeCloseTo(73)
      expect(p.size.y).toBeCloseTo(38)
    })
  })

  describe('multiple faces', () => {
    test('all four sides produce 4 placements', () => {
      const placements = computeCutoutPlacements(V([80, 60, 40]), WALL, FLOOR, 0, Edge.NONE, {
        front: defaultCutout,
        back: defaultCutout,
        left: defaultCutout,
        right: defaultCutout,
      })
      expect(placements).toHaveLength(4)
    })

    test('all five faces produce 5 placements', () => {
      const placements = computeCutoutPlacements(V([80, 60, 40]), WALL, FLOOR, 0, Edge.NONE, {
        front: defaultCutout,
        back: defaultCutout,
        left: defaultCutout,
        right: defaultCutout,
        bottom: defaultCutout,
      })
      expect(placements).toHaveLength(5)
    })

    test('no cutouts returns empty array', () => {
      const placements = computeCutoutPlacements(V([80, 60, 40]), WALL, FLOOR, 0, Edge.NONE, {})
      expect(placements).toHaveLength(0)
    })
  })
})
