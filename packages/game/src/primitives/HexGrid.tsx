import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'
import type { FC } from 'react'
import { range } from '@jsxcad/utils'

import { Cuboid } from './Cuboid.js'
import { Cylinder } from './Cylinder.js'

type BaseHexGridProps = {
  size: AxisRecordDefinition
  hexInnerDiameter: number
  hexWidth: number
}

/** Props for HexGrid. Specify either `offset` or `center`, but not both. */
export type HexGridProps = BaseHexGridProps &
  ({ offset?: AxisRecordDefinition; center?: never } | { center?: boolean; offset?: never })

const Hex: FC<{ hexInnerDiameter: number; hexWidth: number; height: number }> = ({
  hexInnerDiameter,
  hexWidth,
  height,
}) => {
  return (
    <subtract>
      <Cylinder size={{ xy: hexInnerDiameter + hexWidth * 2, z: height }} segments={6} />
      <translate by={{ xy: hexWidth }}>
        <Cylinder size={{ xy: hexInnerDiameter, z: height }} segments={6} />
      </translate>
    </subtract>
  )
}

export const HexGrid: FC<HexGridProps> = (props) => {
  const { size, hexInnerDiameter, hexWidth } = props

  // Determine offset from either explicit value or centering calculation
  let offset: AxisRecordDefinition | undefined
  if ('center' in props && props.center === true) {
    offset = {
      x: ((V(size).x - hexInnerDiameter - hexWidth * 2) % (hexInnerDiameter * 1.5 + hexWidth)) / 2,
      y:
        -(
          (V(size).y - ((hexInnerDiameter / 4) * Math.sqrt(3) + hexWidth / 2) * 2 - hexWidth) %
          (((hexInnerDiameter / 4) * Math.sqrt(3) + hexWidth / 2) * 2)
        ) / 2,
    }
  } else if ('offset' in props) {
    offset = props.offset
  }

  const rowSpacing = (hexInnerDiameter / 4) * Math.sqrt(3) + hexWidth / 2
  const columnSpacing = hexInnerDiameter * 1.5 + hexWidth

  const offsetV = V(offset)
  const offsetDim = V({
    xy: offsetV,
    x: Math.max(0, Math.ceil(-offsetV.x / columnSpacing) * columnSpacing),
    y: Math.max(0, Math.ceil(-offsetV.y / (2 * rowSpacing)) * (2 * rowSpacing)),
  })

  const renderDim = V(size).a(offsetDim)
  const rows = Math.ceil((renderDim.y - hexWidth) / rowSpacing)
  const columns = Math.ceil((renderDim.x - hexWidth) / columnSpacing)
  const evenOffset = hexInnerDiameter * 0.75 + hexWidth / 2

  return (
    <intersect>
      <Cuboid size={size} />
      <translate by={offsetDim.m(-1)}>
        <union>
          {range(rows + 1).flatMap((y) =>
            range(columns + 1).map((x) => (
              <translate by={{ x: x * columnSpacing + (y % 2) * evenOffset, y: y * rowSpacing }} key={`${x}-${y}`}>
                <Hex hexInnerDiameter={hexInnerDiameter} hexWidth={hexWidth} height={renderDim.z} />
              </translate>
            )),
          )}
        </union>
      </translate>
    </intersect>
  )
}
