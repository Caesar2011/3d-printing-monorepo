import { createServer } from 'node:http'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

import { logger } from './logger.js'

type RenderMode = 'websocket' | '3mf'

interface ServerState {
  latestScene: string | null
  renderMode: RenderMode
}

const state: ServerState = {
  latestScene: null,
  renderMode: 'websocket',
}

const app = express()
const port = parseInt(process.env.PORT ?? '3000', 10)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const publicDir = path.join(packageRoot, 'public')
const mfPath = path.join(publicDir, 'output.3mf')

app.use(express.json())
app.use('/dist', express.static(path.join(packageRoot, 'dist')))
app.use(express.static(publicDir))

app.get('/api/scene', (_req, res) => {
  if (state.latestScene != null) {
    res.type('application/json').send(state.latestScene)
  } else {
    res.status(404).json({ error: 'No scene available yet' })
  }
})

app.get('/api/mode', (_req, res) => {
  res.json({ mode: state.renderMode })
})

app.post('/api/mode', (req, res) => {
  const mode = req.body?.mode
  if (mode !== 'websocket' && mode !== '3mf') {
    res.status(400).json({ error: 'Invalid mode. Use "websocket" or "3mf".' })
    return
  }
  state.renderMode = mode
  logger.debug(`Render mode changed to: ${mode}`)

  const message = JSON.stringify({ type: 'mode', mode })
  broadcastToViewers(message)
  broadcastToPublishers(message)

  res.json({ mode })
})

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const viewers = new Set<WebSocket>()
const publishers = new Set<WebSocket>()

function broadcastToViewers(message: string): void {
  for (const client of viewers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

function broadcastToPublishers(message: string): void {
  for (const client of publishers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

wss.on('connection', (ws, req) => {
  const isPublisher = req.url === '/ws?role=publisher'

  if (isPublisher) {
    publishers.add(ws)
    logger.debug(`Publisher connected (${publishers.size} total)`)

    ws.on('message', (data) => {
      const message = typeof data === 'string' ? data : data.toString('utf-8')
      state.latestScene = message
      if (state.renderMode === 'websocket') {
        broadcastToViewers(message)
      }
    })

    ws.on('close', () => {
      publishers.delete(ws)
      logger.debug(`Publisher disconnected (${publishers.size} remaining)`)
    })
  } else {
    viewers.add(ws)
    logger.debug(`Viewer connected (${viewers.size} total)`)

    ws.send(JSON.stringify({ type: 'mode', mode: state.renderMode }))

    ws.on('close', () => {
      viewers.delete(ws)
      logger.debug(`Viewer disconnected (${viewers.size} remaining)`)
    })
  }
})

/** Watches the 3MF file for changes using native fs.watch and notifies viewers. */
function watchMfFile(): void {
  const dir = path.dirname(mfPath)
  const basename = path.basename(mfPath)
  let reloadTimer: NodeJS.Timeout | undefined

  const notify3mfUpdated = (): void => {
    // The serializer writes the archive asynchronously; wait briefly so viewers
    // do not fetch the previous file while the replacement is still in flight.
    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => {
      if (state.renderMode === '3mf') {
        broadcastToViewers(JSON.stringify({ type: '3mf-updated', timestamp: Date.now() }))
      }
    }, 50)
  }

  try {
    fs.watch(dir, (eventType, filename) => {
      const changedName = filename?.toString()
      if (changedName == null || changedName.toLowerCase() !== basename.toLowerCase()) return
      notify3mfUpdated()
    })
    logger.debug(`Watching ${mfPath} for changes`)
  } catch {
    logger.warn(`Could not watch ${dir}, falling back to polling`)
    let lastModified = 0
    const poll = (): void => {
      try {
        const mtime = fs.statSync(mfPath).mtimeMs
        if (mtime > lastModified) {
          lastModified = mtime
          if (state.renderMode === '3mf') {
            notify3mfUpdated()
          }
        }
      } catch {
        // File doesn't exist yet
      }
      setTimeout(poll, 1000)
    }
    poll()
  }
}

server.listen(port, () => {
  logger.debug(`Server running at http://localhost:${port}`)
  logger.debug(`Default render mode: ${state.renderMode}`)
  watchMfFile()
})
