import type { Shape } from '../shapes/index.js'

import type { JsonScene } from './serialize-json.js'

export enum RenderMethod {
  All,
  NoContent,
  Flat,
}

export type RenderOptions = {
  fileDir: string
  filePath?: string
  renderTarget: '3mf' | 'json'
  method?: RenderMethod
  dev?: boolean
}
export type RenderCallbacks = {
  onStart?: () => void
  onParsedAst?: () => void
  onRendered?: (shapes: Shape[]) => void
  onChecksDone?: () => void
  onSerialized?: (data: JsonScene | ArrayBuffer) => void
  onSaved?: (filePath: string) => void
}
