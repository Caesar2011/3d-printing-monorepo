import type { Geom2 } from '@jscad/modeling/src/geometries/types.js'

import { deserializeSvg } from './deserializer.js'
import { processNodes } from './processor.js'
import type { SvgOptions } from './types.js'

/**
 * Converts an SVG source string into an array of jscad Geom2 geometries.
 * @param source The SVG source string.
 * @param options Options for parsing, such as `segments`.
 * @returns An array of Geom2 geometries.
 */
export function svgToGeom2s(source: string, options: SvgOptions): Geom2[] {
  const nodes = deserializeSvg(source)
  return processNodes(nodes, options)
}

export type { SvgOptions } from './types.js'
