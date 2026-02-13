import WebSocket from 'ws'

import { logger } from '../logger.js'

const WS_URL = process.env.WS_URL ?? 'ws://localhost:3000/ws?role=publisher'
const MODE_API_URL = process.env.MODE_API_URL ?? 'http://localhost:3000/api/mode'
const CONNECT_TIMEOUT_MS = 5000
const POLL_INTERVAL_MS = 50

let ws: WebSocket | null = null
let connecting = false

function ensureConnection(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(ws)
      return
    }

    if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
      ws = null
    }

    if (connecting) {
      let elapsed = 0
      const check = setInterval(() => {
        elapsed += POLL_INTERVAL_MS
        if (ws && ws.readyState === WebSocket.OPEN) {
          clearInterval(check)
          resolve(ws)
        } else if (elapsed >= CONNECT_TIMEOUT_MS || !connecting) {
          clearInterval(check)
          reject(new Error('Timed out waiting for existing connection attempt'))
        }
      }, POLL_INTERVAL_MS)
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
      if (ws === socket) ws = null
      connecting = false
    })

    socket.on('error', (err) => {
      if (ws === socket) ws = null
      connecting = false
      logger.warn('Publisher WebSocket error', { error: err.message })
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

function isValidRenderMode(data: unknown): data is { mode: 'websocket' | '3mf' } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'mode' in data &&
    ((data as Record<string, unknown>).mode === 'websocket' || (data as Record<string, unknown>).mode === '3mf')
  )
}

/** Queries the server for the current global render mode. */
export async function getRenderMode(): Promise<'websocket' | '3mf'> {
  try {
    const res = await fetch(MODE_API_URL)
    const data: unknown = await res.json()
    if (isValidRenderMode(data)) {
      return data.mode
    }
    logger.warn('Unexpected render mode response, defaulting to websocket', { data })
    return 'websocket'
  } catch {
    return 'websocket'
  }
}
