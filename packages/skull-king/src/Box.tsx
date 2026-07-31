import { ShapeType, V } from '@jsxcad/core'
import { Cuboid, Edge, Fillet, useContainerContext, useShapeContext } from '@jsxcad/game'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'
import { CutoutType } from '@jsxcad/game/dist/container/types.js'

import { DIMS } from './constants.js'

const WALL = 3
const DIVIDER = WALL

const Z_GAP = 0.2
const GAP = 0.5
const LID = 2.6

const GRAB_WIDTH = DIMS.cards.x / 2

const FilletRounding = ({ contentHeight }: { contentHeight: number }) => {
  return (
    <union>
      <translate by={{ x: DIMS.cards.x / 2 }}>
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
      <translate by={{ x: DIMS.cards.x / 2, y: WALL / 2 }}>
        <rotate by={{ z: (Math.PI / 2) * 3 }} center={{ xy: WALL / 4 }}>
          <Fillet size={{ xy: WALL / 2, z: contentHeight }} />
        </rotate>
      </translate>
    </union>
  )
}

export const Box = () => {
  const { floor } = useShapeContext()
  const { radius } = useContainerContext()
  const cardStackHeight = DIMS.cards.z / 2
  const contentHeight = cardStackHeight + DIMS.rulebook.z + DIMS.scoreNotes.z + GAP * 2
  const innerWidth = DIMS.cards.x * 2 + DIVIDER + GAP * 4
  const innerDepth = DIMS.cards.y + GAP * 2
  const size = V([innerWidth + WALL * 2, innerDepth + WALL * 2, contentHeight + floor + LID])

  return (
    <entity name="skullKingBox">
      <subtract>
        <pick typeWhitelist={[ShapeType.Part]}>
          <ClosedContainer
            size={size}
            lid={{ type: 'slide' }}
            wall={WALL}
            divisions={{ at: [0.5] }}
            cutoutEdges={Edge.BOT}
            cutout={{
              bottom: {
                type: CutoutType.EMPTY,
                border: 10,
              },
            }}
          />
        </pick>
        {/* The lower divider retains separate card bays; its top is cleared for the printed material. */}
        <translate by={{ x: WALL + 10, y: WALL, z: floor + cardStackHeight }}>
          <Cuboid size={{ x: innerWidth - 20, y: innerDepth, z: DIMS.rulebook.z + DIMS.scoreNotes.z + GAP * 2 }} />
        </translate>
        {/* Finger grab gap */}
        <translate by={{ x: WALL + DIMS.cards.x / 2 - GRAB_WIDTH / 2, z: floor }}>
          <Cuboid size={{ x: GRAB_WIDTH, y: size.y / 2, z: contentHeight }} />
          <FilletRounding contentHeight={contentHeight} />
        </translate>
        <translate by={{ x: WALL + (DIMS.cards.x / 2) * 3 + DIVIDER + GAP * 2 - GRAB_WIDTH / 2, z: floor }}>
          <Cuboid size={{ x: GRAB_WIDTH, y: size.y / 2, z: contentHeight }} />
          <FilletRounding contentHeight={contentHeight} />
        </translate>
      </subtract>
      <subtract>
        <pick typeWhitelist={[ShapeType.Lid]}>
          <ClosedContainer size={size} lid={{ type: 'slide' }} wall={WALL} divisions={{ at: [0.5] }} />
        </pick>
        <translate by={{ xy: WALL + 15 }}>
          <Cuboid size={size.s({ xy: WALL * 2 + 30 })} radius={radius - WALL} edges={Edge.SIDE} />
        </translate>
      </subtract>
      <translate by={{ x: WALL + GAP, y: WALL + GAP, z: floor + Z_GAP }}>
        <layout gap={GAP}>
          <layoutItem id={'cardsLeft'}>
            <entity type={ShapeType.Content} name="cardsLeft">
              <Cuboid size={DIMS.cards.m({ z: 0.5 })} radius={3} edges={Edge.SIDE} />
            </entity>
          </layoutItem>
          <layoutItem id={'cardsRight'} layout={[{ x: 'cardsLeft', gap: DIVIDER + 2 * GAP }]}>
            <entity type={ShapeType.Content} name="cardsRight">
              <Cuboid size={DIMS.cards.m({ z: 0.5 })} radius={3} edges={Edge.SIDE} />
            </entity>
          </layoutItem>
          <layoutItem id="rulebook" layout={[{ z: 'cardsLeft' }, { y: 'cardsLeft', align: 'center' }]}>
            <entity type={ShapeType.Content} name="rulebook">
              <Cuboid size={DIMS.rulebook} />
            </entity>
          </layoutItem>
          <layoutItem id="scoreNotes" layout={[{ z: 'rulebook' }, { y: 'cardsLeft', align: 'center' }]}>
            <entity type={ShapeType.Content} name="scoreNotes">
              <Cuboid size={DIMS.scoreNotes} />
            </entity>
          </layoutItem>
        </layout>
      </translate>
    </entity>
  )
}
