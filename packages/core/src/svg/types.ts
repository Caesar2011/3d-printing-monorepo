
export type Vec2 = [number, number]

export interface SvgOptions {
  segments: number
}

export interface SvgAttributes {
  // Common presentation attributes
  id?: string
  class?: string
  style?: string
  transform?: string
  fill?: string
  'fill-rule'?: 'nonzero' | 'evenodd'
  stroke?: string
  'stroke-width'?: string
  opacity?: string

  // Geometry attributes
  d?: string
  x?: string
  y?: string
  width?: string
  height?: string
  rx?: string
  ry?: string
  r?: string
  cx?: string
  cy?: string
  points?: string
  x1?: string
  y1?: string
  x2?: string
  y2?: string

  // ViewBox
  viewBox?: string

  // Fallback for unknown attributes
  [key: string]: string | undefined
}

export interface SvgNode {
  tag: string
  attributes: SvgAttributes
  children: SvgNode[]
  text: string
}