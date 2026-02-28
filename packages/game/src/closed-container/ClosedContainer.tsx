import type { FC } from 'react'
import { ShapeType, V } from '@jsxcad/core'

import type { ContainerProps } from '../container/types.js'
import { Container, resolveContainerConfig } from '../container/Container.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { useContainerContext } from '../container/ContainerContext.js'
import { Edge } from '../primitives/index.js'
import { Colors } from '../utils/index.js'

import type { LidProps } from './types.js'
import { getMinWallWidth, SlidingLid, SlidingLidCutout } from './sliding-lid.js'

export const ClosedContainer: FC<ContainerProps & LidProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()
  const { containerRadius, containerEdges, wall } = resolveContainerConfig(options, containerCtx, shapeCtx)
  const containerDimensions = V(size)

  if (options.lid?.type === 'slide' && wall < getMinWallWidth()) {
    throw new Error(`Sliding lid requires a wall thickness of at least ${getMinWallWidth()}mm.`)
  }

  if (options.lid?.type !== 'slide') {
    return <Container size={size} {...options} />
  }

  const isRounded = (Edge.BACK & Edge.SIDE & containerEdges) !== 0
  const radiusForLid = isRounded ? containerRadius : 0

  return (
    <>
      <subtract>
        <Container size={size} {...options} />
        <SlidingLidCutout
          wallThickness={wall}
          containerDimensions={containerDimensions}
          containerRadius={radiusForLid}
        />
      </subtract>
      <entity type={ShapeType.Lid} color={Colors.ORANGE_2}>
        <SlidingLid wallThickness={wall} containerDimensions={containerDimensions} containerRadius={radiusForLid} />
      </entity>
    </>
  )
}
