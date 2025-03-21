import { findProjectRoot } from '@jsxcad/core'
import type { RenderOptions } from '@jsxcad/core'

import { renderComponent } from './render-component.js'

export async function watcher(onWatchedExecution: () => void) {
  if (process.env.WITHIN_WATCHER == null) {
    process.chdir(await findProjectRoot(module.path))
    // Dynamically import required modules.
    const { spawn } = await import('child_process')
    const { TscWatchClient } = await import('tsc-watch')

    let child: ReturnType<typeof spawn> | null = null
    const watch = new TscWatchClient()

    watch.on('started', () => {
      console.log('Compilation started')
      // Kill any existing child process before restarting.
      if (child) {
        console.log('Killing existing process...')
        child.kill()
        child = null
      }
    })

    watch.on('first_success', () => {
      console.log('First success!')
    })

    watch.on('success', () => {
      console.log('Restarting child process...')
      // Spawn a new process using the current executable and arguments.
      child = spawn(process.execPath, process.argv, {
        stdio: 'inherit', // Attached to the same terminal
        env: { ...process.env, WITHIN_WATCHER: 'true' },
      })
    })

    watch.on('compile_errors', () => {
      // on error, compilation errors are displayed anyway
    })

    watch.start('--project', '.')
  } else {
    // Process is already being watched, so execute the actual code.
    onWatchedExecution()
  }
}

export function devComponentWatcher(
  mod: ImportMeta,
  onRender: () => React.ReactElement,
  options?: Partial<RenderOptions>,
) {
  if (import.meta === mod) {
    watcher(() => {
      renderComponent(onRender(), {
        dev: true,
        repeat: 100,
        ...options,
      })
    })
  }
}
