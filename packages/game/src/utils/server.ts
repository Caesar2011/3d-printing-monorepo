import { createServer } from 'node:http'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

import { logger } from '../logger.js'

type RenderMode = 'websocket' | '3mf'

interface ServerState {
  latestScene: string | null
  renderMode: RenderMode
  lastMfModified: number
}

const state: ServerState = {
  latestScene: null,
  renderMode: 'websocket',
  lastMfModified: 0,
}

const app = express()
const port = 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '../..')
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

  // Notify all viewers of the mode change
  for (const client of viewers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'mode', mode }))
    }
  }

  res.json({ mode })
})

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const viewers = new Set<WebSocket>()
const publishers = new Set<WebSocket>()

wss.on('connection', (ws, req) => {
  const isPublisher = req.url === '/ws?role=publisher'

  if (isPublisher) {
    publishers.add(ws)
    logger.debug(`Publisher connected (${publishers.size} total)`)

    ws.on('message', (data) => {
      const message = typeof data === 'string' ? data : data.toString('utf-8')
      state.latestScene = message
      for (const viewer of viewers) {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(message)
        }
      }
    })

    ws.on('close', () => {
      publishers.delete(ws)
      logger.debug(`Publisher disconnected (${publishers.size} remaining)`)
    })
  } else {
    viewers.add(ws)
    logger.debug(`Viewer connected (${viewers.size} total)`)

    // Send current mode on connect
    ws.send(JSON.stringify({ type: 'mode', mode: state.renderMode }))

    ws.on('close', () => {
      viewers.delete(ws)
      logger.debug(`Viewer disconnected (${viewers.size} remaining)`)
    })
  }
})

// Watch 3MF file for changes and notify viewers in 3mf mode
function watchMfFile(): void {
  const check = (): void => {
    try {
      const stat = fs.statSync(mfPath)
      const mtime = stat.mtimeMs
      if (mtime > state.lastMfModified) {
        state.lastMfModified = mtime
        for (const viewer of viewers) {
          if (viewer.readyState === WebSocket.OPEN) {
            viewer.send(JSON.stringify({ type: '3mf-updated', timestamp: mtime }))
          }
        }
      }
    } catch {
      // File doesn't exist yet
    }
    setTimeout(check, 1000)
  }
  check()
}

server.listen(port, () => {
  logger.debug(`Server running at http://localhost:${port}`)
  watchMfFile()
})
