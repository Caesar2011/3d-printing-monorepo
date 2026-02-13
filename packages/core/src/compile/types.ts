import type { Shape } from '../Shape.js'

export enum RenderMethod {
  All,
  NoContent,
  Flat,
}

export type RenderOptions = {
  fileDir: string
  filePath?: string
  method?: RenderMethod
  filter?: (s: Shape) => boolean
  dev?: boolean
  repeat?: number
}
export type RenderCallbacks = {
  onStart?: () => void
  onParsedAst?: () => void
  onRendered?: () => void
  onChecksDone?: () => void
  onSerialized?: () => void
  onSaved?: (filePath: string) => void
}
