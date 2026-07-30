import { compile, type RenderOptions } from '@jsxcad/core'
import WebSocket from 'ws'

import { logger } from './logger.js'

type RenderMode = 'websocket' | '3mf'

export interface Publisher {
  close(): void
}

export interface PublisherOptions extends Partial<RenderOptions> {
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'http://localhost:3000'

function getEndpoints(baseUrl: string) {
  const url = new URL(baseUrl)
  const wsUrl = new URL('/ws?role=publisher', url)
  wsUrl.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return { modeUrl: new URL('/api/mode', url), wsUrl }
}

function isRenderMode(value: unknown): value is RenderMode {
  return value === 'websocket' || value === '3mf'
}

function isModeMessage(value: unknown): value is { type: 'mode'; mode: RenderMode } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'mode' in value &&
    (value as { type: unknown }).type === 'mode' &&
    isRenderMode((value as { mode: unknown }).mode)
  )
}

async function getRenderMode(modeUrl: URL): Promise<RenderMode> {
  const response = await fetch(modeUrl)
  if (!response.ok) throw new Error(`Could not get render mode (${response.status})`)
  const data: unknown = await response.json()
  if (data !== null && typeof data === 'object' && 'mode' in data && isRenderMode(data.mode)) {
    return data.mode
  }
  throw new Error('Invalid render mode response')
}

function createTimingCallbacks(startTime: number) {
  const elapsed = () => `${Math.round(Date.now() - startTime)}ms`
  return {
    onStart: () => logger.debug(`render onStart (${elapsed()})`),
    onParsedAst: () => logger.debug(`render onParsedAst (${elapsed()})`),
    onRendered: () => logger.debug(`render onRendered (${elapsed()})`),
    onChecksDone: () => logger.debug(`render onChecksDone (${elapsed()})`),
    onSerialized: () => logger.debug(`render onSerialized (${elapsed()})`),
    onSaved: (filePath: string) => logger.debug(`render onSaved (${elapsed()})`, { filePath }),
  }
}

/** Renders a component and re-renders it whenever the server render mode changes. */
export async function renderComponent(
  component: React.ReactElement,
  options: PublisherOptions = {},
): Promise<Publisher> {
  const { baseUrl = DEFAULT_BASE_URL, ...renderOptions } = options
  const { modeUrl, wsUrl } = getEndpoints(baseUrl)
  // eslint-disable-next-line prefer-const
  let socket: WebSocket | undefined
  let closed = false
  let renderQueue = Promise.resolve()

  const render = (mode: RenderMode): Promise<void> => {
    renderQueue = renderQueue
      .then(async () => {
        if (closed) return
        const profiler = logger.startTimer()
        const callbacks = createTimingCallbacks(profiler.start.valueOf())
        logger.debug(`Rendering component for ${mode}`)
        await compile(component, {
          fileDir: import.meta.dirname,
          dev: true,
          renderTarget: mode === '3mf' ? '3mf' : 'json',
          ...renderOptions,
          ...callbacks,
          onSerialized: (scene) => {
            if (scene instanceof ArrayBuffer) return
            const json = JSON.stringify(scene)
            if (socket?.readyState !== WebSocket.OPEN) {
              logger.warn('Could not publish scene: publisher is disconnected')
              return
            }
            socket.send(json)
            logger.debug(
              `Published scene via WebSocket (${(json.length / 1024).toFixed(1)} KB, ${scene.meshes.length} meshes)`,
            )
          },
        })
        profiler.done()
      })
      .catch((error: unknown) => {
        logger.error('Scene compile failed', error)
      })
    return renderQueue
  }

  socket = new WebSocket(wsUrl)
  socket.on('message', (data) => {
    try {
      const message: unknown = JSON.parse(data.toString())
      if (isModeMessage(message)) render(message.mode)
    } catch {
      logger.warn('Ignoring invalid publisher WebSocket message')
    }
  })
  socket.on('error', (error) => logger.warn('Publisher WebSocket error', { error: error.message }))
  socket.on('close', () => logger.debug('Publisher WebSocket disconnected'))
  await new Promise<void>((resolve, reject) => {
    socket!.once('open', resolve)
    socket!.once('error', reject)
  })
  logger.debug('Publisher WebSocket connected')

  try {
    await render(await getRenderMode(modeUrl))
  } catch (error) {
    socket.close()
    throw error
  }

  return {
    close: () => {
      if (closed) return
      closed = true
      socket?.close()
    },
  }
}
