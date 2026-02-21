import type { FC } from 'react'
import type { Vector3 } from '@jsxcad/core'
import { ShapeType, V } from '@jsxcad/core'

import type { ContainerProps } from '../container/types.js'
import { Container, resolveContainerConfig } from '../container/Container.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { useContainerContext } from '../container/ContainerContext.js'
import { Cuboid, Cylinder, Edge } from '../primitives/index.js'
import { Colors } from '../utils/index.js'

import type { LidProps } from './types.js'

const CONTAINER_LID_CARVE_OUT = 1.5
const CONTAINER_LID_HEIGHT = 2.6
const LID_TOLERANCE_Z = 0.2

function getSlideCalculations(containerRadius: number, wall: number, dim: Vector3) {
  const offsetX = wall - CONTAINER_LID_CARVE_OUT
  const w = containerRadius - (offsetX + LID_TOLERANCE_Z + 2.08 + 1.3)
  let lidEndY = 1
  if (w > 0) {
    const innerRadius = Math.max(containerRadius - wall, 0)
    const h = Math.sqrt(innerRadius ** 2 - w ** 2)

    lidEndY = Math.max(containerRadius - h, 1)
  }
  const slideDim = V({
    x: dim.x - offsetX * 2,
    y: dim.y - lidEndY,
    z: CONTAINER_LID_HEIGHT,
  })
  return { offsetX, slideDim }
}

// TODO entry tilt edges 45
function ContainerLidCutout({ wall, dim, containerRadius }: { wall: number; dim: Vector3; containerRadius: number }) {
  const { offsetX, slideDim } = getSlideCalculations(containerRadius, wall, dim)
  const containerLidTopX = slideDim.z / Math.tan(Math.PI / 3)

  const LeftContainerSide = () => (
    <prism
      points={[
        { xy: 0 },
        { x: offsetX, y: 0 },
        { x: offsetX, y: slideDim.y - 7.5 },
        { x: offsetX + 1, y: slideDim.y - 6.5 },
        { x: offsetX + 1, y: slideDim.y - 5.5 },
        { x: offsetX, y: slideDim.y - 4.5 },
        { x: offsetX, y: slideDim.y - Math.tan(Math.PI / 3) * 2.08 },
        { x: offsetX + 2.08, y: slideDim.y },
        { x: 0, y: slideDim.y },
      ]}
      height={dim.z}
    />
  )

  return (
    <union>
      <subtract>
        <translate
          by={{
            x: offsetX,
            y: slideDim.y,
            z: dim.z - slideDim.z,
          }}
        >
          <rotate by={{ x: Math.PI / 2 }}>
            <prism
              points={[
                { x: 0, y: 0 },
                { x: slideDim.x, y: 0 },
                { x: slideDim.x - containerLidTopX, y: slideDim.z },
                { x: containerLidTopX, y: slideDim.z },
              ]}
              height={slideDim.y}
            />
          </rotate>
        </translate>
        <LeftContainerSide />
        <mirror normal={{ x: 1 }} origin={{ x: dim.x / 2 }}>
          <LeftContainerSide />
        </mirror>
      </subtract>
      <cuboid
        size={{ x: slideDim.x - (2.08 + 1.77) * 2, y: dim.y, z: slideDim.z }}
        center={{ x: dim.x / 2, y: dim.y / 2, z: dim.z - slideDim.z / 2 }}
      />
    </union>
  )
}

function SlideLid({
  wall,
  dim,
  containerRadius,
}: {
  wall: number
  dim: Vector3
  containerRadius: number
  options?: Omit<ContainerProps & LidProps, 'size'>
}) {
  const { offsetX, slideDim } = getSlideCalculations(containerRadius, wall, dim)
  const lidExtraOffsetX = LID_TOLERANCE_Z + LID_TOLERANCE_Z / Math.tan(Math.PI / 3)
  const lidDim = V({
    xy: slideDim,
    x: -lidExtraOffsetX * 2,
    z: slideDim.z - LID_TOLERANCE_Z,
  })

  const containerLidTopX = lidDim.z / Math.tan(Math.PI / 3)

  const LeftLidSide = () => (
    <union>
      <prism
        points={[
          { xy: 0 },
          { x: offsetX + LID_TOLERANCE_Z, y: 0 },
          { x: offsetX + LID_TOLERANCE_Z, y: lidDim.y - 7.5 },
          { x: offsetX + LID_TOLERANCE_Z + 1, y: lidDim.y - 6.5 },
          { x: offsetX + LID_TOLERANCE_Z + 1, y: lidDim.y - 5.5 },
          { x: offsetX + LID_TOLERANCE_Z, y: lidDim.y - 4.5 },
          { x: offsetX + LID_TOLERANCE_Z, y: lidDim.y - Math.tan(Math.PI / 3) * 2.08 },
          { x: offsetX + LID_TOLERANCE_Z + 2.08, y: lidDim.y },
          { x: offsetX + LID_TOLERANCE_Z + 2.08 + 0.8, y: lidDim.y },
          { x: offsetX + LID_TOLERANCE_Z + 2.08 + 0.8, y: lidDim.y - 12 },
          { x: offsetX + LID_TOLERANCE_Z + 2.08 + 1.8, y: lidDim.y - 12 },
          { x: offsetX + LID_TOLERANCE_Z + 2.08 + 1.8, y: dim.y },
          { x: 0, y: dim.y },
        ]}
        height={dim.z}
      />
      <Cylinder
        size={{ xy: 1, z: dim }}
        center={{ x: offsetX + LID_TOLERANCE_Z + 2.08 + 1.3, y: lidDim.y - 12, z: dim.z / 2 }}
      />
    </union>
  )

  return (
    <intersect>
      <union>
        <subtract>
          <translate
            by={{
              x: offsetX + lidExtraOffsetX,
              y: lidDim.y,
              z: dim.z - lidDim.z,
            }}
          >
            <rotate by={{ x: Math.PI / 2 }}>
              <prism
                points={[
                  { x: 0, y: 0 },
                  { x: lidDim.x, y: 0 },
                  { x: lidDim.x - containerLidTopX, y: lidDim.z },
                  { x: containerLidTopX, y: lidDim.z },
                ]}
                height={lidDim.y}
              />
            </rotate>
          </translate>
          <LeftLidSide />
          <mirror normal={{ x: 1 }} origin={{ x: dim.x / 2 }}>
            <LeftLidSide />
          </mirror>
        </subtract>
        <cuboid
          size={{ x: slideDim.x - (LID_TOLERANCE_Z + 2.08 + 1.8) * 2, y: dim.y, z: lidDim.z }}
          center={{ x: dim.x / 2, y: dim.y / 2, z: dim.z - lidDim.z / 2 }}
        />
      </union>
      <Cuboid size={dim} radius={containerRadius} edges={Edge.SIDE} />
    </intersect>
  )
}

export const ClosedContainer: FC<ContainerProps & LidProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()
  const { scoop, containerRadius, containerEdges, containerCutoutEdges, wall, floor, scoopFactor, maxImprintSize } =
    resolveContainerConfig(options, containerCtx, shapeCtx)
  const dim = V(size)

  if (options.lid?.type === 'slide' && wall < 3) {
    // throw error
  }

  if (options.lid === undefined) {
    return <Container size={size} {...options} />
  } else if (options.lid.type === 'slide') {
    return (
      <>
        <subtract>
          <Container size={size} {...options} />
          <ContainerLidCutout
            wall={wall}
            dim={dim}
            containerRadius={(Edge.BACK & Edge.SIDE & containerEdges) !== 0 ? containerRadius : 0}
          />
        </subtract>
        <entity type={ShapeType.Lid} color={Colors.ORANGE_2}>
          <SlideLid
            wall={wall}
            dim={dim}
            containerRadius={(Edge.BACK & Edge.SIDE & containerEdges) !== 0 ? containerRadius : 0}
            options={options}
          />
        </entity>
      </>
    )
  }
}
