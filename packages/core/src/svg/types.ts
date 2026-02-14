import type jscad from '@jscad/modeling'
import type { Color } from '@jscad/modeling/src/geometries/types.js'

export type Vec2 = [number, number]

export interface SvgOptions {
  segments: number
}

export type SvgAttributes = Record<string, string>

export interface SvgNode {
  tag: string
  attributes: SvgAttributes
  children: SvgNode[]
  text: string
}

export interface SvgTransformable {
  transform: jscad.maths.mat4.Mat4
}

export interface SvgFillable {
  fill?: Color
  fillRule?: 'nonzero' | 'evenodd'
}

export interface SvgStrokable {
  stroke?: Color
  strokeWidth?: number
}

export interface SvgShape extends SvgTransformable, SvgFillable, SvgStrokable {
  outlines: Vec2[][]
}
