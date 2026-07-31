import { ShapeType, V } from '@jsxcad/core'
import { Cuboid, Edge, Fillet, useContainerContext, useShapeContext } from '@jsxcad/game'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'
import { CutoutType } from '@jsxcad/game/dist/container/types.js'

import { DIMS } from './constants.js'

const WALL = 3
const DIVIDER = WALL

const GAP = 0.5
const Z_GAP = 0.2
const LID = 2.6

const PODEST = DIMS.regions.z - DIMS.sanctuaries.z

const GRAB_WIDTH_SANCTUARIES = DIMS.sanctuaries.x / 2
const GRAB_WIDTH_REGIONS = DIMS.regions.x / 2

const FilletRounding = ({ cardWidth, contentHeight }: { cardWidth: number; contentHeight: number }) => {
  return (
    <union>
      <translate by={{ x: cardWidth / 2 }}>
        <Fillet size={{ xy: WALL / 2, z: contentHeight }} />
      </translate>
      <translate by={{ x: -WALL / 2 }}>
        <rotate by={{ z: Math.PI / 2 }} center={{ xy: WALL / 4 }}>
          <Fillet size={{ xy: WALL / 2, z: contentHeight }} />
        </rotate>
      </translate>
      <translate by={{ x: -WALL / 2, y: WALL / 2 }}>
        <rotate by={{ z: Math.PI }} center={{ xy: WALL / 4 }}>
          <Fillet size={{ xy: WALL / 2, z: contentHeight }} />
        </rotate>
      </translate>
      <translate by={{ x: cardWidth / 2, y: WALL / 2 }}>
        <rotate by={{ z: (Math.PI / 2) * 3 }} center={{ xy: WALL / 4 }}>
          <Fillet size={{ xy: WALL / 2, z: contentHeight }} />
        </rotate>
      </translate>
    </union>
  )
}

export const Box = () => {
  const { floor } = useShapeContext()
  const { radius, cutout } = useContainerContext()
  const contentHeight = DIMS.regions.z + GAP
  const innerWidth = DIMS.sanctuaries.x + DIVIDER + DIMS.regions.x + GAP * 4
  const innerDepth = DIMS.regions.y + GAP * 2
  const size = V([innerWidth + WALL * 2, innerDepth + WALL * 2, contentHeight + floor + LID])
  const dividerFraction = (DIMS.sanctuaries.x + GAP * 2) / (innerWidth - DIVIDER)

  return (
    <entity name="farawayBox">
      <subtract>
        <union>
          <pick typeWhitelist={[ShapeType.Part]}>
            <ClosedContainer
              size={size}
              lid={{ type: 'slide' }}
              wall={WALL}
              divisions={{ at: [dividerFraction] }}
              cutoutEdges={Edge.BOT}
              cutout={{
                bottom: {
                  type: CutoutType.EMPTY,
                  border: 10,
                },
              }}
            />
          </pick>
          {/* Podest lifts the sanctuaries stack to the regions height. */}
          <translate by={{ xy: WALL, z: floor }}>
            <Cuboid size={{ xy: DIMS.sanctuaries.a(GAP * 2), z: PODEST }} />
          </translate>
        </union>
        {/* Finger grab gaps */}
        <translate by={{ x: WALL + GAP + DIMS.sanctuaries.x / 2 - GRAB_WIDTH_SANCTUARIES / 2, z: floor + PODEST }}>
          <Cuboid size={{ x: GRAB_WIDTH_SANCTUARIES, y: size.y / 2, z: DIMS.sanctuaries.z + GAP }} />
          <FilletRounding cardWidth={DIMS.sanctuaries.x} contentHeight={DIMS.sanctuaries.z + GAP} />
        </translate>
        <translate
          by={{
            x: WALL + GAP + DIMS.sanctuaries.x + DIVIDER + GAP * 2 + DIMS.regions.x / 2 - GRAB_WIDTH_REGIONS / 2,
            z: floor,
          }}
        >
          <Cuboid size={{ x: GRAB_WIDTH_REGIONS, y: size.y / 2, z: contentHeight }} />
          <FilletRounding cardWidth={DIMS.regions.x} contentHeight={contentHeight} />
        </translate>
        {/* Podest cutout */}
        <translate by={{ xy: WALL + 10 }}>
          <Cuboid
            size={{ xy: DIMS.sanctuaries.a(GAP * 2 - 10 * 2), y: GAP * 2, z: size }}
            radius={cutout.borderRadius}
            edges={Edge.SIDE}
          />
        </translate>
      </subtract>
      <subtract>
        <pick typeWhitelist={[ShapeType.Lid]}>
          <ClosedContainer size={size} lid={{ type: 'slide' }} wall={WALL} divisions={{ at: [dividerFraction] }} />
        </pick>
        <translate by={{ xy: WALL + 15 }}>
          <Cuboid size={size.s({ xy: WALL * 2 + 30 })} radius={radius - WALL} edges={Edge.SIDE} />
        </translate>
      </subtract>
      <translate by={{ xy: WALL + GAP, z: floor + PODEST + Z_GAP }}>
        <entity type={ShapeType.Content} name="sanctuaries">
          <Cuboid size={DIMS.sanctuaries} radius={3} edges={Edge.SIDE} />
        </entity>
      </translate>
      <translate by={{ x: WALL + GAP + DIMS.sanctuaries.x + DIVIDER + GAP * 2, y: WALL + GAP, z: floor + Z_GAP }}>
        <entity type={ShapeType.Content} name="regions">
          <Cuboid size={DIMS.regions} radius={3} edges={Edge.SIDE} />
        </entity>
      </translate>
    </entity>
  )
}
