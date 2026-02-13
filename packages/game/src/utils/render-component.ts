import { compileToJson, type RenderOptions } from '@jsxcad/core'

import { logger } from '../logger.js'

import { publishScene } from './ws-publisher.js'

export async function renderComponent(component: React.ReactElement, renderOpts?: Partial<RenderOptions>) {
  const profiler = logger.startTimer()
  logger.debug('Rendering component')

  const callbacks = {
    onStart: () => {
      logger.debug('render onStart (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)')
    },
    onParsedAst: () => {
      logger.debug('render onParsedAst (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)')
    },
    onRendered: () => {
      logger.debug('render onRendered (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)')
    },
    onChecksDone: () => {
      logger.debug('render onChecksDone (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)')
    },
    onSerialized: () => {
      logger.debug('render onSerialized (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)')
    },
    onSaved: (filePath: string) => {
      logger.debug('render onSaved (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)', { filePath })
    },
  }

  // Stream JSON scene via WebSocket for instant preview
  try {
    await compileToJson(component, {
      fileDir: import.meta.dirname,
      dev: true,
      ...renderOpts,
      ...callbacks,
      onScene: (scene) => {
        const json = JSON.stringify(scene)
        publishScene(json)
        logger.debug(
          `Published scene via WebSocket (${(json.length / 1024).toFixed(1)} KB, ${scene.meshes.length} meshes)`,
        )
      },
    })
  } catch (e) {
    logger.error('WebSocket render failed, falling back to 3MF', e)
  }

  // Also write 3MF for file-based workflows (slicing, export)
  /*await compile(component, {
    fileDir: import.meta.dirname,
    dev: true,
    ...renderOpts,
    ...callbacks,
  })*/

  profiler.done()
}
