import jscad from '@jscad/modeling'

import type { Shape } from '../shapes/index.js'

const { geom3 } = jscad.geometries

export interface JsonVertex {
  x: number
  y: number
  z: number
}

export interface JsonTriangle {
  vertices: [JsonVertex, JsonVertex, JsonVertex]
}

export interface JsonMesh {
  name: string
  color: [number, number, number, number] | null
  triangles: JsonTriangle[]
}

export interface JsonScene {
  version: 1
  meshes: JsonMesh[]
}

/** Converts Shape instances into a JSON scene descriptor with triangulated polygons. */
export function serializeToJson(shapes: Shape[]): JsonScene {
  const meshes: JsonMesh[] = shapes.map((shape) => {
    const polygons = geom3.toPolygons(shape)
    const triangles: JsonTriangle[] = []

    for (const polygon of polygons) {
      const verts = polygon.vertices
      for (let i = 1; i < verts.length - 1; i++) {
        triangles.push({
          vertices: [
            { x: verts[0][0], y: verts[0][1], z: verts[0][2] },
            { x: verts[i][0], y: verts[i][1], z: verts[i][2] },
            { x: verts[i + 1][0], y: verts[i + 1][1], z: verts[i + 1][2] },
          ],
        })
      }
    }

    const color = shape.color
      ? ([shape.color[0], shape.color[1], shape.color[2], shape.color[3] ?? 1] as [number, number, number, number])
      : null

    return {
      name: shape.name,
      color,
      triangles,
    }
  })

  return { version: 1, meshes }
}
