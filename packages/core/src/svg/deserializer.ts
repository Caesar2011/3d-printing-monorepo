import { SaxesParser } from 'saxes'

import { logger } from '../logger.js'

import type { SvgAttributes, SvgNode } from './types.js'

/**
 * Deserializes an SVG source string into a tree of SvgNode objects.
 * This is an intermediate representation, not the final geometry.
 */
export function deserializeSvg(source: string): SvgNode[] {
  const parser = new SaxesParser()
  const rootNodes: SvgNode[] = []
  const stack: SvgNode[] = []

  parser.on('opentag', (tag) => {
    const node: SvgNode = {
      tag: tag.name,
      attributes: tag.attributes as SvgAttributes,
      children: [],
      text: '',
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      rootNodes.push(node)
    }
    stack.push(node)
  })

  parser.on('closetag', () => {
    stack.pop()
  })

  parser.on('text', (text) => {
    if (stack.length > 0) {
      stack[stack.length - 1].text += text
    }
  })

  parser.on('error', (error) => {
    logger.error(`SVG parsing error: ${error.message}`)
  })

  parser.write(source).close()
  return rootNodes
}
