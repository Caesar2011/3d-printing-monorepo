import { createServer } from 'node:http'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

import { logger } from '../logger.js'

const app = express()
const port = 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '../..')

let latestScene: string | null = null

app.use('/dist', express.static(path.join(packageRoot, 'dist')))
app.use(express.static(path.join(packageRoot, 'public')))

app.get('/api/scene', (_req, res) => {
  if (latestScene != null) {
    res.type('application/json').send(latestScene)
  } else {
    res.status(404).json({ error: 'No scene available yet' })
  }
})

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Set<WebSocket>()

wss.on('connection', (ws, req) => {
  const isPublisher = req.url === '/ws?role=publisher'

  if (isPublisher) {
    logger.debug('Publisher connected')
    ws.on('message', (data) => {
      const message = typeof data === 'string' ? data : data.toString('utf-8')
      latestScene = message
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      }
    })
  } else {
    logger.debug(`Viewer client connected (${clients.size + 1} total)`)
  }

  clients.add(ws)

  ws.on('close', () => {
    clients.delete(ws)
    logger.debug(`Client disconnected (${clients.size} total)`)
  })
})

server.listen(port, () => {
  logger.debug(`Server running at http://localhost:${port}`)
})
