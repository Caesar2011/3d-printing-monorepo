import WebSocket from 'ws'

import { logger } from '../logger.js'

let ws: WebSocket | null = null
const pendingMessage: string | null = null
let connecting = false

const WS_URL = 'ws://localhost:3000/ws?role=publisher'

function ensureConnection(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(ws)
      return
    }

    if (connecting) {
      const check = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          clearInterval(check)
          resolve(ws)
        }
      }, 50)
      return
    }

    connecting = true
    const socket = new WebSocket(WS_URL)

    socket.on('open', () => {
      ws = socket
      connecting = false
      logger.debug('Publisher WebSocket connected')
      resolve(socket)
    })

    socket.on('close', () => {
      ws = null
      connecting = false
    })

    socket.on('error', (err) => {
      ws = null
      connecting = false
      logger.warn('Publisher WebSocket error (server may not be running)', { error: err.message })
      reject(err)
    })
  })
}

/** Sends a JSON scene string to the WebSocket server for relay to viewers. */
export async function publishScene(sceneJson: string): Promise<void> {
  try {
    const socket = await ensureConnection()
    socket.send(sceneJson)
  } catch {
    logger.warn('Could not publish scene via WebSocket — is the server running?')
  }
}