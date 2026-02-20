import type { FC } from 'react'
import React from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'
import { V } from '@jsxcad/core'

import { svgToOutlines, type SvgOutline } from './index.js'

export type SvgShapeProps = {
  file: string
  size: AxisRecordDefinition
  segments?: number
  center?: AxisRecordDefinition
  fillSize?: boolean
}

const wrapInUnion = (elements: (React.JSX.Element | null)[], key: string) => {
  const validElements = elements.filter((element): element is React.JSX.Element => element !== null)
  if (validElements.length === 0) {
    return null
  }
  if (validElements.length === 1) {
    return validElements[0]
  }
  return <union key={key}>{validElements}</union>
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
  const { minX, minY, maxX, maxY } = outlineGroups.reduce(
    (acc, group) =>
      group.outlines.reduce(
        (acc, outline) =>
          outline.points.reduce((acc, [x, y]) => {
            acc.minX = Math.min(x, acc.minX)
            acc.minY = Math.min(y, acc.minY)
            acc.maxX = Math.max(x, acc.maxX)
            acc.maxY = Math.max(y, acc.maxY)
            return acc
          }, acc),
        acc,
      ),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  )

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

  // Offset to first move SVG origin to 0,0, then center within target area.
  // This is calculated in the pre-scaled coordinate space.
  const centeringOffsetX = fillSize === true ? 0 : (targetW / scaleX - svgW) / 2
  const centeringOffsetY = fillSize === true ? 0 : (targetH / scaleY - svgH) / 2
  const totalOffsetX = -minX + centeringOffsetX
  const totalOffsetY = -minY + centeringOffsetY

  const renderOutline = (outline: SvgOutline, key: string) => {
    const transformedPoints = outline.points.map(([x, y]) =>
      V([(x + totalOffsetX) * scaleX, (y + totalOffsetY) * scaleY]),
    )
    return <prism key={key} points={transformedPoints} height={height} />
  }

  return (
    <translate by={center ?? 0}>
      {outlineGroups.map((group, gi) => {
        const solids = group.outlines.filter((o) => o.role === 'solid' && o.points.length >= 3)
        const holes = group.outlines.filter((o) => o.role === 'hole' && o.points.length >= 3)

        if (solids.length === 0) {
          return null
        }

        const solidElements = solids.map((s, si) => renderOutline(s, `g${gi}-s${si}`))

        if (holes.length === 0) {
          return wrapInUnion(solidElements, `g${gi}`)
        }

        const solidsPart = wrapInUnion(solidElements, `g${gi}-solids`)
        const holeElements = holes.map((h, hi) => renderOutline(h, `g${gi}-h${hi}`))

        return (
          <subtract key={`g${gi}`}>
            {solidsPart}
            {holeElements}
          </subtract>
        )
      })}
    </translate>
  )
}
