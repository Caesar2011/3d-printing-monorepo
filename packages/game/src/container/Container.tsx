import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { Cuboid } from '../primitives/index.js'
import { useShapeContext } from '../shape/ShapeContext.js'
import { Edge } from '../primitives/Cuboid.js'
import type { DeepRequired } from '../utils/deep-merge.js'

import type { ContainerProps, Cutout as CutoutType } from './types.js'
import { useContainerContext } from './ContainerContext.js'

const CutoutPos = ['bottom', 'front', 'left', 'back', 'right'] as const
type CutoutTransform = {
  translation: AxisRecordDefinition
  rotation: AxisRecordDefinition
  size: AxisRecordDefinition
  options: Required<CutoutType>
}

const Cutout: FC<{
  size: AxisRecordDefinition
  opts: Required<CutoutType>
}> = ({ size, opts, cutoutType }) => {
  const containerCtx = useContainerContext()
  const cuboidRadius = opts.borderRadius === null ? containerCtx.radius : opts.borderRadius

  return (
    <subtract>
      <Cuboid size={size} radius={cuboidRadius} edges={Edge.SIDE} />
    </subtract>
  )
}

const Cutouts: FC = ({
  size,
  floor,
  wall,
  opts,
}: {
  size: AxisRecordDefinition
  opts: DeepRequired<ContainerProps>['cutout']
  floor: number
  wall: number
}) => {
  const cutouts: CutoutTransform[] = [
    ...(opts.bottom
      ? [
          {
            translation: { xy: opts.bottom.border },
            rotation: 0,
            size: { xy: V(size).s((opts.bottom?.border ?? 0) * 2), z: floor },
            options: opts.bottom,
          },
        ]
      : []),
    ...(opts.cutout.left
      ? [
          {
            translation: { xy: opts.cutout.bottom?.border },
            rotation: 0,
            size: { xy: V(size).s((opts.cutout.bottom?.border ?? 0) * 2), z: floor },
            options: opts.cutout.bottom,
          },
        ]
      : []),
  ]

  return cutouts.map((cutout, idx) => (
    <translate by={cutout.translation} key={idx}>
      <rotate by={cutout.rotation}>
        <Cutout size={cutout.size} opts={cutout.options} />
      </rotate>
    </translate>
  ))
}

export const Container: FC<ContainerProps> = ({ size, ...options }) => {
  const shapeCtx = useShapeContext()
  const containerCtx = useContainerContext()
  const opts = {
    ...shapeCtx,
    ...containerCtx,
    ...options,
    cutout: {
      bottom: options.cutout?.bottom ? { ...containerCtx.cutout, ...options.cutout.bottom } : undefined,
      front:
        options.cutout?.side || options.cutout?.front
          ? { ...containerCtx.cutout, ...options.cutout.side, ...options.cutout?.front }
          : undefined,
      left:
        options.cutout?.side || options.cutout?.left
          ? { ...containerCtx.cutout, ...options.cutout.side, ...options.cutout?.left }
          : undefined,
      back:
        options.cutout?.side || options.cutout?.back
          ? { ...containerCtx.cutout, ...options.cutout.side, ...options.cutout?.back }
          : undefined,
      right:
        options.cutout?.side || options.cutout?.right
          ? { ...containerCtx.cutout, ...options.cutout.side, ...options.cutout?.right }
          : undefined,
    },
  }

  const innerRadius = Math.max(0, opts.radius - opts.wall)
  return (
    <subtract>
      <Cuboid size={size} edges={opts.edges} radius={opts.radius} />
      <translate by={{ xy: opts.wall, z: opts.floor }}>
        <Cuboid
          size={V(size).s({ xy: opts.wall * 2, z: opts.floor })}
          edges={opts.edges & ~Edge.TOP}
          radius={innerRadius}
        />
      </translate>
      {/* eslint-disable-next-line */}
      <Cutouts size={size} wall={opts.wall} floor={opts.floor} opts={opts.cutout}></Cutouts>
    </subtract>
  )
}
