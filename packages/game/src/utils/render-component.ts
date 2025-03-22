import { compile, type RenderOptions } from '@jsxcad/core'

import { logger } from '../logger.js'

export async function renderComponent(component: React.ReactElement, renderOpts?: Partial<RenderOptions>) {
  const profiler = logger.startTimer()
  logger.debug('Rendering component')
  await compile(component, {
    fileDir: import.meta.dirname,
    dev: true,
    ...renderOpts,
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
    onSaved: (filePath) => {
      logger.debug('render onSaved to  (' + Math.round(Date.now() - profiler.start.valueOf()) + 'ms)', { filePath })
    },
  })
  profiler.done()
}
