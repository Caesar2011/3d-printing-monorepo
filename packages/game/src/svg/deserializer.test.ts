import { describe, expect, test } from 'vitest'

import { deserializeSvg } from './deserializer.js'

describe('deserializeSvg', () => {
  test('parses a simple SVG with a rect', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="50"/></svg>'
    const nodes = deserializeSvg(svg)

    expect(nodes).toHaveLength(1)
    expect(nodes[0].tag).toBe('svg')
    expect(nodes[0].children).toHaveLength(1)
    expect(nodes[0].children[0].tag).toBe('rect')
    expect(nodes[0].children[0].attributes.width).toBe('100')
    expect(nodes[0].children[0].attributes.height).toBe('50')
  })

  test('parses nested groups', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g id="layer1"><circle cx="10" cy="10" r="5"/></g></svg>'
    const nodes = deserializeSvg(svg)

    expect(nodes[0].children[0].tag).toBe('g')
    expect(nodes[0].children[0].attributes.id).toBe('layer1')
    expect(nodes[0].children[0].children[0].tag).toBe('circle')
  })

  test('preserves hyphenated attributes like fill-rule', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 10" fill-rule="evenodd"/></svg>'
    const nodes = deserializeSvg(svg)

    const path = nodes[0].children[0]
    expect(path.attributes['fill-rule']).toBe('evenodd')
  })

  test('preserves text content', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Hello</text></svg>'
    const nodes = deserializeSvg(svg)

    expect(nodes[0].children[0].text).toBe('Hello')
  })

  test('returns empty array for empty input', () => {
    const nodes = deserializeSvg('')
    expect(nodes).toHaveLength(0)
  })

  test('parses self-closing path element', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 0 L10 10 Z"/></svg>'
    const nodes = deserializeSvg(svg)

    expect(nodes[0].children).toHaveLength(1)
    expect(nodes[0].children[0].tag).toBe('path')
    expect(nodes[0].children[0].attributes.d).toBe('M0 0 L10 0 L10 10 Z')
  })

  test('parses large d attribute without truncation', () => {
    const points = Array.from({ length: 500 }, (_, i) => `${i} ${i * 2}`).join(' L ')
    const d = `M ${points} Z`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`
    const nodes = deserializeSvg(svg)

    expect(nodes[0].children[0].attributes.d).toBe(d)
  })

  test('parses multiple sibling elements', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><circle r="5"/><path d="M0 0"/></svg>'
    const nodes = deserializeSvg(svg)

    expect(nodes[0].children).toHaveLength(3)
    expect(nodes[0].children.map((c) => c.tag)).toEqual(['rect', 'circle', 'path'])
  })
})
