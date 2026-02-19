import type { Vec2 } from './types.js'
import { loadSvgSource } from './load-svg.js'
import { deserializeSvg } from './deserializer.js'
import { extractOutlines } from './outline-extractor.js'

export type { SvgOptions } from './types.js'

export interface SvgOutline {
  points: Vec2[]
  role: 'solid' | 'hole'
}

export interface SvgOutlineGroup {
  outlines: SvgOutline[]
}

export interface SvgParseOptions {
  segments: number
}

/**
 * Converts an SVG file URI or data URL into classified outline groups
 * ready for rendering as prism primitives.
 */
export function svgToOutlines(file: string, options: SvgParseOptions): SvgOutlineGroup[] {
  const source = loadSvgSource(file)
  const nodes = deserializeSvg(source)
  return extractOutlines(nodes, options)
}
