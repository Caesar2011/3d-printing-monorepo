import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { svgToOutlines, type SvgOutline } from '../svg/index.js'

export type SvgShapeProps = {
  file: string
  size: AxisRecordDefinition
  segments?: number
  center?: AxisRecordDefinition
  fillSize?: boolean
}

/** Loads an SVG file and renders it as extruded prism primitives. */
export const SvgShape: FC<SvgShapeProps> = ({ file, size, segments, center, fillSize }) => {
  const sizeVec = V(size)
  const height = sizeVec.z
  const targetW = sizeVec.x
  const targetH = sizeVec.y

  const outlineGroups = svgToOutlines(file, { segments: segments ?? 32 })

  if (outlineGroups.length === 0) {
    throw new Error(`SVG file produced no geometry: ${file}`)
  }

  // Compute bounding box of all outlines
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const group of outlineGroups) {
    for (const outline of group.outlines) {
      for (const [x, y] of outline.points) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  const svgW = maxX - minX
  const svgH = maxY - minY

  if (svgW <= 0 || svgH <= 0) {
    throw new Error(`SVG file has zero-size bounding box: ${file}`)
  }

  let scaleX: number
  let scaleY: number

  if (fillSize === true) {
    scaleX = targetW / svgW
    scaleY = targetH / svgH
  } else {
    const scaleFactor = Math.min(targetW / svgW, targetH / svgH)
    scaleX = scaleFactor
    scaleY = scaleFactor
  }

  // Offset to move SVG origin to 0,0 then center within target area
  const offsetX = -minX + (fillSize === true ? 0 : (targetW / scaleX - svgW) / 2)
  const offsetY = -minY + (fillSize === true ? 0 : (targetH / scaleY - svgH) / 2)

  const renderOutline = (outline: SvgOutline, key: string) => {
    const transformedPoints: [number, number][] = outline.points.map(([x, y]) => [
      (x + offsetX) * scaleX,
      (y + offsetY) * scaleY,
    ])
    return <prism key={key} points={transformedPoints} height={height} />
  }

  return (
    <translate by={center ?? 0}>
      {outlineGroups.map((group, gi) => {
        const solids = group.outlines.filter((o) => o.role === 'solid' && o.points.length >= 3)
        const holes = group.outlines.filter((o) => o.role === 'hole' && o.points.length >= 3)

        if (solids.length === 0) return null

        if (holes.length === 0) {
          if (solids.length === 1) {
            return renderOutline(solids[0], `g${gi}-s0`)
          }
          return <union key={`g${gi}`}>{solids.map((s, si) => renderOutline(s, `g${gi}-s${si}`))}</union>
        }

        const solidsPart =
          solids.length === 1 ? (
            renderOutline(solids[0], `g${gi}-s0`)
          ) : (
            <union key={`g${gi}-solids`}>{solids.map((s, si) => renderOutline(s, `g${gi}-s${si}`))}</union>
          )

        return (
          <subtract key={`g${gi}`}>
            {solidsPart}
            {holes.map((h, hi) => renderOutline(h, `g${gi}-h${hi}`))}
          </subtract>
        )
      })}
    </translate>
  )
}
