import type { FC } from 'react'
import type { Vector3 } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { Cuboid, Cylinder, Edge } from '../primitives/index.js'
import type { ContainerProps } from '../container/types.js'

import type { LidProps } from './types.js'

// --- Dimensions & Tolerances ---
const SLIDE_LID_HEIGHT = 2.6
const SLIDE_LID_TOLERANCE = 0.2 // General tolerance for sliding parts
const SLIDE_CARVE_OUT_FROM_WALL = 1.5

// --- Slide Rail Geometry ---
const SLIDE_RAIL_ANGLE = Math.PI / 3 // 60 degrees
const SLIDE_RAIL_WIDTH = 2.08
const SLIDE_RAIL_CLEARANCE = 1.3 // Extra clearance for the rail on curved containers

// --- Lock Bump Geometry ---
const LOCK_BUMP_WIDTH = 1.0
const LOCK_BUMP_START_OFFSET_Y = 7.5
const LOCK_BUMP_PEAK_START_OFFSET_Y = 6.5
const LOCK_BUMP_PEAK_END_OFFSET_Y = 5.5
const LOCK_BUMP_END_OFFSET_Y = 4.5

// --- Lid Handle Geometry ---
const LID_HANDLE_PULL_TAB_WIDTH = 0.8
const LID_HANDLE_POST_WIDTH = 1.0
const LID_HANDLE_Y_OFFSET = 12.0

// --- Derived Constants ---
const TAN_SLIDE_RAIL_ANGLE = Math.tan(SLIDE_RAIL_ANGLE)

interface SlidingMechanismProps {
  wallThickness: number
  containerDimensions: Vector3
  containerRadius: number
  options?: Omit<ContainerProps & LidProps, 'size'>
}

function getSlideCalculations(containerRadius: number, wallThickness: number, containerDimensions: Vector3) {
  const railOffsetFromWall = wallThickness - SLIDE_CARVE_OUT_FROM_WALL

  // Calculate where the slide mechanism would intersect a rounded inner corner
  // to ensure the slide rail doesn't poke through the inner wall.
  const slideWidthAtInnerRadius =
    containerRadius - (railOffsetFromWall + SLIDE_LID_TOLERANCE + SLIDE_RAIL_WIDTH + SLIDE_RAIL_CLEARANCE)

  let slideRailStartY = 1 // Default start Y for non-rounded or large-radius corners.
  if (slideWidthAtInnerRadius > 0) {
    const innerRadius = Math.max(containerRadius - wallThickness, 0)
    // Use Pythagorean theorem to find the height (h) on the circle where the slide intersects.
    const innerRadiusHeightAtSlideEdge = Math.sqrt(innerRadius ** 2 - slideWidthAtInnerRadius ** 2)
    // The Y coordinate for the start of the slide is the container radius minus this height.
    slideRailStartY = Math.max(containerRadius - innerRadiusHeightAtSlideEdge, 1)
  }

  const slideDimensions = V({
    x: containerDimensions.x - railOffsetFromWall * 2,
    y: containerDimensions.y - slideRailStartY,
    z: SLIDE_LID_HEIGHT,
  })

  return { railOffsetFromWall, slideDimensions }
}

export function getMinWallWidth() {
  return SLIDE_CARVE_OUT_FROM_WALL + 1.5
}

const AngledSlide: FC<{ dimensions: Vector3; angle: number }> = ({ dimensions, angle }) => {
  const topXOffset = dimensions.z / Math.tan(angle)
  return (
    <prism
      points={[
        { x: 0, y: 0 },
        { x: dimensions.x, y: 0 },
        { x: dimensions.x - topXOffset, y: dimensions.z },
        { x: topXOffset, y: dimensions.z },
      ]}
      height={dimensions.y}
    />
  )
}

const ContainerSideProfileCutout: FC<{
  railOffsetFromWall: number
  slideDimensions: Vector3
  containerHeight: number
}> = ({ railOffsetFromWall, slideDimensions, containerHeight }) => (
  <prism
    points={[
      { xy: 0 },
      { x: railOffsetFromWall, y: 0 },
      { x: railOffsetFromWall, y: slideDimensions.y - LOCK_BUMP_START_OFFSET_Y },
      { x: railOffsetFromWall + LOCK_BUMP_WIDTH, y: slideDimensions.y - LOCK_BUMP_PEAK_START_OFFSET_Y },
      { x: railOffsetFromWall + LOCK_BUMP_WIDTH, y: slideDimensions.y - LOCK_BUMP_PEAK_END_OFFSET_Y },
      { x: railOffsetFromWall, y: slideDimensions.y - LOCK_BUMP_END_OFFSET_Y },
      { x: railOffsetFromWall, y: slideDimensions.y - TAN_SLIDE_RAIL_ANGLE * SLIDE_RAIL_WIDTH },
      { x: railOffsetFromWall + SLIDE_RAIL_WIDTH, y: slideDimensions.y },
      { x: 0, y: slideDimensions.y },
    ]}
    height={containerHeight}
  />
)

export const SlidingLidCutout: FC<Omit<SlidingMechanismProps, 'options'>> = ({
  wallThickness,
  containerDimensions,
  containerRadius,
}) => {
  const { railOffsetFromWall, slideDimensions } = getSlideCalculations(
    containerRadius,
    wallThickness,
    containerDimensions,
  )

  const SideCutout = () => (
    <ContainerSideProfileCutout
      railOffsetFromWall={railOffsetFromWall}
      slideDimensions={slideDimensions}
      containerHeight={containerDimensions.z}
    />
  )

  return (
    <union>
      <subtract>
        <translate
          by={{
            x: railOffsetFromWall,
            y: slideDimensions.y,
            z: containerDimensions.z - slideDimensions.z,
          }}
        >
          <rotate by={{ x: Math.PI / 2 }}>
            <AngledSlide dimensions={slideDimensions} angle={SLIDE_RAIL_ANGLE} />
          </rotate>
        </translate>
        <SideCutout />
        <mirror normal={{ x: 1 }} origin={{ x: containerDimensions.x / 2 }}>
          <SideCutout />
        </mirror>
      </subtract>
      <cuboid
        size={{
          x:
            slideDimensions.x -
            (SLIDE_RAIL_WIDTH + SLIDE_LID_TOLERANCE + LID_HANDLE_PULL_TAB_WIDTH + LID_HANDLE_POST_WIDTH / 2) * 2,
          y: containerDimensions.y,
          z: slideDimensions.z,
        }}
        center={{
          x: containerDimensions.x / 2,
          y: containerDimensions.y / 2,
          z: containerDimensions.z - slideDimensions.z / 2,
        }}
      />
    </union>
  )
}

const LidSideProfile: FC<{
  railOffsetFromWall: number
  lidDimensions: Vector3
  containerDimensions: Vector3
}> = ({ railOffsetFromWall, lidDimensions, containerDimensions }) => {
  const railX = railOffsetFromWall + SLIDE_LID_TOLERANCE
  const railEndX = railX + SLIDE_RAIL_WIDTH
  const handlePostOuterX = railEndX + LID_HANDLE_PULL_TAB_WIDTH + LID_HANDLE_POST_WIDTH
  const cylinderRadius = LID_HANDLE_POST_WIDTH / 2
  const cylinderCenterX = handlePostOuterX - cylinderRadius

  return (
    <union>
      <prism
        points={[
          { xy: 0 },
          { x: railX, y: 0 },
          { x: railX, y: lidDimensions.y - LOCK_BUMP_START_OFFSET_Y },
          { x: railX + LOCK_BUMP_WIDTH, y: lidDimensions.y - LOCK_BUMP_PEAK_START_OFFSET_Y },
          { x: railX + LOCK_BUMP_WIDTH, y: lidDimensions.y - LOCK_BUMP_PEAK_END_OFFSET_Y },
          { x: railX, y: lidDimensions.y - LOCK_BUMP_END_OFFSET_Y },
          { x: railX, y: lidDimensions.y - TAN_SLIDE_RAIL_ANGLE * SLIDE_RAIL_WIDTH },
          { x: railEndX, y: lidDimensions.y },
          { x: railEndX + LID_HANDLE_PULL_TAB_WIDTH, y: lidDimensions.y },
          { x: railEndX + LID_HANDLE_PULL_TAB_WIDTH, y: lidDimensions.y - LID_HANDLE_Y_OFFSET },
          { x: handlePostOuterX, y: lidDimensions.y - LID_HANDLE_Y_OFFSET },
          { x: handlePostOuterX, y: containerDimensions.y },
          { x: 0, y: containerDimensions.y },
        ]}
        height={containerDimensions.z}
      />
      <Cylinder
        size={{ xy: LID_HANDLE_POST_WIDTH, z: containerDimensions.z }}
        center={{
          x: cylinderCenterX,
          y: lidDimensions.y - LID_HANDLE_Y_OFFSET,
          z: containerDimensions.z / 2,
        }}
      />
    </union>
  )
}

export const SlidingLid: FC<Omit<SlidingMechanismProps, 'options'>> = ({
  wallThickness,
  containerDimensions,
  containerRadius,
}) => {
  const { railOffsetFromWall, slideDimensions } = getSlideCalculations(
    containerRadius,
    wallThickness,
    containerDimensions,
  )

  const lidRailTolerance = SLIDE_LID_TOLERANCE + SLIDE_LID_TOLERANCE / TAN_SLIDE_RAIL_ANGLE
  const lidDimensions = V({
    xyz: slideDimensions,
    x: -lidRailTolerance * 2,
    z: -SLIDE_LID_TOLERANCE,
  })

  const handleProfileWidthOnSide =
    SLIDE_LID_TOLERANCE + SLIDE_RAIL_WIDTH + LID_HANDLE_PULL_TAB_WIDTH + LID_HANDLE_POST_WIDTH

  const Side = () => (
    <LidSideProfile
      railOffsetFromWall={railOffsetFromWall}
      lidDimensions={lidDimensions}
      containerDimensions={containerDimensions}
    />
  )

  return (
    <intersect>
      <union>
        <subtract>
          <translate
            by={{
              x: railOffsetFromWall + lidRailTolerance,
              y: lidDimensions.y,
              z: containerDimensions.z - lidDimensions.z,
            }}
          >
            <rotate by={{ x: Math.PI / 2 }}>
              <AngledSlide dimensions={lidDimensions} angle={SLIDE_RAIL_ANGLE} />
            </rotate>
          </translate>
          <Side />
          <mirror normal={{ x: 1 }} origin={{ x: containerDimensions.x / 2 }}>
            <Side />
          </mirror>
        </subtract>
        <cuboid
          size={{
            x: slideDimensions.x - handleProfileWidthOnSide * 2,
            y: containerDimensions.y,
            z: lidDimensions.z,
          }}
          center={{
            x: containerDimensions.x / 2,
            y: containerDimensions.y / 2,
            z: containerDimensions.z - lidDimensions.z / 2,
          }}
        />
      </union>
      <Cuboid size={containerDimensions} radius={containerRadius} edges={Edge.SIDE} />
    </intersect>
  )
}
