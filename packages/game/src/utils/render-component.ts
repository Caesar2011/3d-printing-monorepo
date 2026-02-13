import { compile, compileToJson, type RenderOptions } from '@jsxcad/core'

import { logger } from '../logger.js'

import { publishScene, getRenderMode } from './ws-publisher.js'

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

/** Renders a component according to the current server render mode. */
export async function renderComponent(
  component: React.ReactElement,
  renderOpts?: Partial<RenderOptions>,
): Promise<void> {
  const profiler = logger.startTimer()
  logger.debug('Rendering component')

  const mode = await getRenderMode()
  logger.debug(`Server render mode: ${mode}`)

  const callbacks = createTimingCallbacks(profiler.start.valueOf())

  if (mode === '3mf') {
    // 3MF mode: write file only, no WebSocket push.
    // Fire and forget — don't block the caller on heavy IO + serialization.
    compile(component, {
      fileDir: import.meta.dirname,
      dev: true,
      ...renderOpts,
      ...callbacks,
    }).catch((e) => {
      logger.error('3MF compilation failed', e)
    })
  } else {
    // WebSocket mode: compile to JSON and push to viewers. No file IO.
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
      logger.error('WebSocket scene compile failed', e)
    }
  }

  profiler.done()
}
