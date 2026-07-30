import { ShapeType, V } from '@jsxcad/core'
import { Cuboid, useContainerContext, useShapeContext } from '@jsxcad/game'
import { ClosedContainer } from '@jsxcad/game/dist/closed-container/ClosedContainer.js'

import { DIMS } from './constants.js'

const WALL = 3
const SCOOP_WIDTH = 18.5
const BOX_SIZE = V({ x: 190, y: 48, z: DIMS.resources.stone.size.x + 5 })

const FOOD_SPLIT = 115 / 190
const WOOD_SPLIT = 95 / 190
const LIFE_SPLIT = 145 / 190

type Resource = keyof typeof DIMS.resources

type ResourceBoxProps = {
  first: Resource
  second: Resource
  split: number
}

const contentVolume = (resource: Resource) => {
  const { size, count } = DIMS.resources[resource]
  return 2 * size.x * size.y * size.z * count
}

const ResourceBox = ({ first, second, split }: ResourceBoxProps) => {
  const { floor } = useShapeContext()
  const { radius } = useContainerContext()
  const innerRadius = radius - WALL
  const innerX = BOX_SIZE.x - WALL * 2
  const innerY = BOX_SIZE.y - WALL * 2 - innerRadius * 2
  const firstX = innerX * split - WALL / 2
  const secondX = innerX - firstX - WALL

  const content = (resource: Resource, x: number) => {
    return resource === 'dice' ? diceContent(x) : otherContent(resource, x)
  }

  const otherContent = (resource: Exclude<Resource, 'dice'>, x: number) => {
    const width = x - 2 * SCOOP_WIDTH
    return (
      <entity type={ShapeType.Content} name={`Content_${resource}`}>
        <translate by={{ x: SCOOP_WIDTH }}>
          <Cuboid size={{ x: width, y: innerY, z: contentVolume(resource) / (width * innerY) }} />
        </translate>
      </entity>
    )
  }

  const diceContent = (x: number) => {
    const GAP = 2
    const width = DIMS.resources.dice.size.x
    const translateX = (x - width) / 2
    const depth = DIMS.resources.dice.size.y * 2 + GAP
    const translateY = (innerY - depth) / 2
    return (
      <translate by={{ x: translateX, y: translateY }}>
        <layout gap={GAP}>
          <layoutItem id={'d1'}>
            <entity type={ShapeType.Content} name={`Content_dice1`}>
              <Cuboid size={DIMS.resources.dice.size} />
            </entity>
          </layoutItem>
          <layoutItem id={'d2'} layout={[{ y: 'd1' }]}>
            <entity type={ShapeType.Content} name={`Content_dice2`}>
              <Cuboid size={DIMS.resources.dice.size} />
            </entity>
          </layoutItem>
        </layout>
      </translate>
    )
  }

  return (
    <entity name={`${first}_${second}`}>
      <ClosedContainer
        size={BOX_SIZE}
        lid={{ type: 'slide' }}
        wall={WALL}
        scoop
        divisions={{ at: [split], children: [null, second === 'dice' ? { scoop: false } : null] }}
      />
      <translate by={{ xy: WALL, y: innerRadius, z: floor }}>{content(first, firstX)}</translate>
      <translate by={{ x: WALL + firstX + WALL, y: WALL + innerRadius, z: floor }}>
        {content(second, secondX)}
      </translate>
    </entity>
  )
}

export const FoodResources = () => <ResourceBox first="food" second="wheat" split={FOOD_SPLIT} />

export const BuildResources = () => <ResourceBox first="wood" second="stone" split={WOOD_SPLIT} />

export const LifeResources = () => <ResourceBox first="life" second="dice" split={LIFE_SPLIT} />
