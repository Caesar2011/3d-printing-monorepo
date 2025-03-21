import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'
import type { FC } from 'react'
import { ShapeType } from '@jsxcad/core/dist/Shape.js'

import { Cylinder } from './Cylinder.js'
import { Cuboid } from './Cuboid.js'
import { range } from './utils.js'
import { Colors } from './colors.js'
import { devComponentWatcher } from './watcher.js'

export interface HexGridProps {
  size: AxisRecordDefinition
  hexInnerDiameter: number
  hexWidth: number
  offset?: AxisRecordDefinition
  center?: boolean
}

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

export const HexGrid: FC<HexGridProps> = ({ size, offset, center, hexInnerDiameter, hexWidth }) => {
  // todo: fix hex width mit math calculations
  console.assert(offset === undefined || center === undefined)

  const rowSpacing = (hexInnerDiameter / 4) * Math.sqrt(3) + hexWidth / 2
  const columnSpacing = hexInnerDiameter * 1.5 + hexWidth

  if (center === true) {
    offset = {
      x: ((V(size).x - hexInnerDiameter - hexWidth * 2) % columnSpacing) / 2,
      y: -((V(size).y - rowSpacing * 2 - hexWidth) % (rowSpacing * 2)) / 2,
    }
  }

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
              <translate by={{ x: x * columnSpacing + (y % 2) * evenOffset, y: y * rowSpacing }}>
                <Hex hexInnerDiameter={hexInnerDiameter} hexWidth={hexWidth} height={renderDim.z} />
              </translate>
            )),
          )}
        </union>
      </translate>
    </intersect>
  )
}

devComponentWatcher(import.meta, () => {
  const dim = V({ x: 100, y: 16, z: 2 })
  return (
    <>
      <HexGrid size={dim} hexInnerDiameter={10} hexWidth={1} center={true} />
      <subtract name={'outer'} type={ShapeType.Technical} color={Colors.BLUE_2}>
        <translate by={{ xy: -0.1 }}>
          <Cuboid size={dim.a({ xy: 0.2 })} />
        </translate>
        <Cuboid size={dim} />
      </subtract>
    </>
  )
})
