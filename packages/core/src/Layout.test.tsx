import { beforeEach, describe, expect, test } from 'vitest'

import { PrimitiveNode } from './shapes/index.js'
import { parseAst } from './render.js'

beforeEach(() => {
  PrimitiveNode.clearCache()
})

async function render(element: React.ReactNode) {
  return (await parseAst(element)).render()
}

describe('layout', () => {
  test('positions an item after a referenced item with the layout default gap', async () => {
    const shapes = await render(
      <layout gap={2}>
        <layoutItem id="stand">
          <cuboid size={{ x: 10, y: 1, z: 1 }} />
        </layoutItem>
        <layoutItem id="cards" layout={[{ x: 'stand' }]}>
          <cuboid size={{ x: 3, y: 1, z: 1 }} />
        </layoutItem>
      </layout>,
    )

    expect(shapes[1].boundingBox.position.x).toBe(12)
  })

  test('uses the furthest reference when positioned after multiple items', async () => {
    const shapes = await render(
      <layout>
        <layoutItem id="first">
          <cuboid size={{ x: 10, y: 1, z: 1 }} />
        </layoutItem>
        <layoutItem id="second">
          <translate by={{ x: 20 }}>
            <cuboid size={{ x: 5, y: 1, z: 1 }} />
          </translate>
        </layoutItem>
        <layoutItem id="result" layout={[{ x: 'first' }, { x: 'second', gap: 2 }]}>
          <cuboid size={{ x: 1, y: 1, z: 1 }} />
        </layoutItem>
      </layout>,
    )

    expect(shapes[2].boundingBox.position.x).toBe(27)
  })

  test('applies gaps in the alignment direction', async () => {
    const shapes = await render(
      <layout>
        <layoutItem id="reference">
          <cuboid size={{ x: 10, y: 10, z: 1 }} />
        </layoutItem>
        <layoutItem id="start" layout={[{ x: 'reference', align: 'start', gap: 2 }]}>
          <cuboid size={{ x: 1, y: 1, z: 1 }} />
        </layoutItem>
        <layoutItem id="end" layout={[{ x: 'reference', align: 'end', gap: 2 }]}>
          <cuboid size={{ x: 1, y: 1, z: 1 }} />
        </layoutItem>
        <layoutItem id="center" layout={[{ y: 'reference', align: 'center', gap: 2 }]}>
          <cuboid size={{ x: 1, y: 1, z: 1 }} />
        </layoutItem>
      </layout>,
    )

    expect(shapes[1].boundingBox.position.x).toBe(2)
    expect(shapes[2].boundingBox.position.x).toBe(7)
    expect(shapes[3].boundingBox.position.y).toBe(6.5)
  })

  test('resolves items declared before their references and rejects cycles', async () => {
    const shapes = await render(
      <layout>
        <layoutItem id="cards" layout={[{ y: 'stand', gap: 1 }]}>
          <cuboid size={{ x: 1, y: 1, z: 1 }} />
        </layoutItem>
        <layoutItem id="stand">
          <cuboid size={{ x: 1, y: 10, z: 1 }} />
        </layoutItem>
      </layout>,
    )
    expect(shapes[0].boundingBox.position.y).toBe(11)

    await expect(
      render(
        <layout>
          <layoutItem id="a" layout={[{ x: 'b' }]}>
            <cuboid size={{ x: 1, y: 1, z: 1 }} />
          </layoutItem>
          <layoutItem id="b" layout={[{ x: 'a' }]}>
            <cuboid size={{ x: 1, y: 1, z: 1 }} />
          </layoutItem>
        </layout>,
      ),
    ).rejects.toThrow('Circular layout reference')
  })
})
