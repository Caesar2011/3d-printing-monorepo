import { parseAst } from '@jsxcad/core'
import type { Shape } from '@jsxcad/core'

export async function getShapes(node: React.ReactNode): Promise<Shape[]> {
  const rootNode = await parseAst(node)
  return rootNode.render()
}

export function isLidOrPart(shape: { name: string }): boolean {
  const name = shape.name.toLowerCase()
  return name.includes('part') || name.includes('lid')
}

export function computeCandidateAngles(x: number, y: number, w: number, h: number): number[] {
  const angles = [0, Math.PI / 2]

  const addBoundaryAngles = (firstSide: number, secondSide: number, limit: number) => {
    const radius = Math.hypot(firstSide, secondSide)
    const offset = Math.atan2(secondSide, firstSide)
    const delta = Math.acos(limit / radius)

    for (const angle of [offset - delta, offset + delta]) {
      if (angle >= 0 && angle <= Math.PI / 2) angles.push(angle)
    }
  }

  if (w <= Math.hypot(x, y)) addBoundaryAngles(x, y, w)
  if (h <= Math.hypot(x, y)) addBoundaryAngles(y, x, h)

  return angles
}

export function fitsShapeOnBed(
  x: number,
  y: number,
  w0: number,
  h0: number,
  w: number,
  h: number,
): { fits: boolean; optAngle: number; maxXAtOpt: number; maxYAtOpt: number } {
  const fitsLandscape = x <= w0 && y <= h0
  const fitsPortrait = x <= h0 && y <= w0

  const angles = computeCandidateAngles(x, y, w, h)

  const diagonalAngle = angles.find((angle) => {
    const projX = x * Math.cos(angle) + y * Math.sin(angle)
    const projY = x * Math.sin(angle) + y * Math.cos(angle)
    return projX <= w && projY <= h
  })
  const fitsDiagonally = diagonalAngle !== undefined

  const optAngle =
    diagonalAngle ??
    angles.reduce((bestAngle, angle) => {
      const bestOverflow = Math.max(
        (x * Math.cos(bestAngle) + y * Math.sin(bestAngle)) / w,
        (x * Math.sin(bestAngle) + y * Math.cos(bestAngle)) / h,
      )
      const overflow = Math.max(
        (x * Math.cos(angle) + y * Math.sin(angle)) / w,
        (x * Math.sin(angle) + y * Math.cos(angle)) / h,
      )
      return overflow < bestOverflow ? angle : bestAngle
    })
  const sin = Math.sin(optAngle)
  const cos = Math.cos(optAngle)
  const maxXAtOpt = Math.max(0, Math.min((w - y * sin) / cos, (h - y * cos) / sin))
  const maxYAtOpt = Math.max(0, Math.min((w - x * cos) / sin, (h - x * sin) / cos))

  return { fits: fitsDiagonally || fitsLandscape || fitsPortrait, optAngle, maxXAtOpt, maxYAtOpt }
}

export function getShapePairs<T extends { name: string }>(
  shapes: T[],
): Array<{ first: T; second: T; firstName: string; secondName: string }> {
  return shapes.flatMap((first, firstIndex) =>
    shapes.slice(firstIndex + 1).map((second) => ({
      first,
      second,
      firstName: first.name,
      secondName: second.name,
    })),
  )
}
