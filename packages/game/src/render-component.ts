import type { RenderOptions } from '@jsxcad/core/dist/compile.js'
import { compile } from '@jsxcad/core'

export async function renderComponent(component: React.ReactElement, renderOpts?: Partial<RenderOptions>) {
  console.time('render')
  console.timeLog('render')
  await compile(component, {
    fileDir: import.meta.dirname,
    dev: true,
    ...renderOpts,
    onStart: () => {
      console.timeLog('render', 'onStart')
    },
    onRendered: () => {
      console.timeLog('render', 'onRendered')
    },
    onChecksDone: () => {
      console.timeLog('render', 'onChecksDone')
    },
    onSerialized: () => {
      console.timeLog('render', 'onSerialized')
    },
    onSaved: (filePath) => {
      console.timeLog('render', 'onSaved', filePath)
    },
  })
  console.timeEnd('render')
}
