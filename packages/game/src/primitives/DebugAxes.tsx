import type { FC, ReactNode } from 'react'
import { ShapeType, V } from '@jsxcad/core'

import { Colors } from '../utils/colors.js'


const AXIS_THICKNESS = 0.4
const TICK_MINOR_THICKNESS = 0.6
const TICK_MINOR_LENGTH = 1
const TICK_MAJOR_THICKNESS = 0.8
const TICK_MAJOR_LENGTH = 2

type AxisRange = { min?: number; max?: number }

export interface DebugAxesProps {
  x?: number | AxisRange
  y?: number | AxisRange
  z?: number | AxisRange
  children?: ReactNode
}

function resolveRange(value: number | AxisRange | undefined, fallback: number): { min: number; max: number } {
  if (value === undefined) return { min: 0, max: fallback }
  if (typeof value === 'number') return { min: 0, max: value }
  return { min: value.min ?? 0, max: value.max ?? fallback }
}

const Axis: FC<{
  length: number
  offset: number
  color: [number, number, number]
  direction: 'x' | 'y' | 'z'
  name: string
}> = ({ length, offset, color, direction, name }) => {
  const totalLength = length - offset
  if (totalLength <= 0) return null

  const axisSize =
    direction === 'x' ? V([totalLength, AXIS_THICKNESS, AXIS_THICKNESS]) :
      direction === 'y' ? V([AXIS_THICKNESS, totalLength, AXIS_THICKNESS]) :
        V([AXIS_THICKNESS, AXIS_THICKNESS, totalLength])

  const axisTranslation =
    direction === 'x' ? V([offset, -AXIS_THICKNESS / 2, -AXIS_THICKNESS / 2]) :
      direction === 'y' ? V([-AXIS_THICKNESS / 2, offset, -AXIS_THICKNESS / 2]) :
        V([-AXIS_THICKNESS / 2, -AXIS_THICKNESS / 2, offset])

  const ticks: { pos: number; major: boolean }[] = []
  const start = Math.ceil(offset)
  for (let i = start; i <= length; i++) {
    if (i === 0) continue
    ticks.push({ pos: i, major: i % 10 === 0 })
  }

  return (
    <entity name={`debug-axis-${name}`} type={ShapeType.Technical} color={color}>
      <translate by={axisTranslation}>
        <cuboid size={axisSize} />
      </translate>
      {ticks.map((tick) => {
        const thickness = tick.major ? TICK_MAJOR_THICKNESS : TICK_MINOR_THICKNESS
        const tickLength = tick.major ? TICK_MAJOR_LENGTH : TICK_MINOR_LENGTH

        const tickSize =
          direction === 'x' ? V([AXIS_THICKNESS, tickLength, tickLength]) :
            direction === 'y' ? V([tickLength, AXIS_THICKNESS, tickLength]) :
              V([tickLength, tickLength, AXIS_THICKNESS])

        const tickTranslation =
          direction === 'x' ? V([tick.pos - AXIS_THICKNESS / 2, -tickLength / 2, -tickLength / 2]) :
            direction === 'y' ? V([-tickLength / 2, tick.pos - AXIS_THICKNESS / 2, -tickLength / 2]) :
              V([-tickLength / 2, -tickLength / 2, tick.pos - AXIS_THICKNESS / 2])

        return (
          <translate by={tickTranslation} key={`${name}-${tick.pos}`}>
            <cuboid size={tickSize} />
          </translate>
        )
      })}
    </entity>
  )
}

/** Renders a 3D coordinate system with colored axes and tick marks. */
export const DebugAxes: FC<DebugAxesProps> = ({ x, y, z, children }) => {
  const xRange = resolveRange(x, 100)
  const yRange = resolveRange(y, 100)
  const zRange = resolveRange(z, 100)

  return (
    <entity name={'debug-axes'} type={ShapeType.Technical}>
      <Axis length={xRange.max} offset={xRange.min} color={Colors.RED_2} direction="x" name="x" />
      <Axis length={yRange.max} offset={yRange.min} color={Colors.GREEN_2} direction="y" name="y" />
      <Axis length={zRange.max} offset={zRange.min} color={Colors.BLUE_2} direction="z" name="z" />
      {children}
    </entity>
  )
}
