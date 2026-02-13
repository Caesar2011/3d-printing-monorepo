import { compile, compileToJson, type RenderOptions } from '@jsxcad/core'

import { logger } from '../logger.js'

import { publishScene } from './ws-publisher.js'

function createTimingCallbacks(startTime: number) {
  const elapsed = () => Math.round(Date.now() - startTime) + 'ms'
  return {
    onStart: () => logger.debug(`render onStart (${elapsed()})`),
    onParsedAst: () => logger.debug(`render onParsedAst (${elapsed()})`),
    onRendered: () => logger.debug(`render onRendered (${elapsed()})`),
    onChecksDone: () => logger.debug(`render onChecksDone (${elapsed()})`),
    onSerialized: () => logger.debug(`render onSerialized (${elapsed()})`),
    onSaved: (filePath: string) => logger.debug(`render onSaved (${elapsed()})`, { filePath }),
  }
}

export interface RenderComponentOptions extends Partial<RenderOptions> {
  /** When true, skip writing the 3MF file to disk. */
  skipFile?: boolean
}

/** Renders a component to WebSocket JSON and optionally to a 3MF file. */
export async function renderComponent(
  component: React.ReactElement,
  renderOpts?: RenderComponentOptions,
): Promise<void> {
  const profiler = logger.startTimer()
  const { skipFile, ...fileOpts } = renderOpts ?? {}
  logger.debug('Rendering component')

  const callbacks = createTimingCallbacks(profiler.start.valueOf())

  try {
    await compileToJson(component, {
      fileDir: import.meta.dirname,
      dev: true,
      ...fileOpts,
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
    logger.error('WebSocket scene publish failed', e)
  }

  if (skipFile === true) {
    try {
      await compile(component, {
        fileDir: import.meta.dirname,
        dev: true,
        ...fileOpts,
        ...callbacks,
      })
    } catch (e) {
      logger.error('3MF compilation failed', e)
    }
  } else {
    logger.debug('Skipping 3MF file output (WebSocket-only mode)')
  }

  profiler.done()
}
