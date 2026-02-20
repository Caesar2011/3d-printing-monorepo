import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Loads SVG source from a file path, file:// URL, or data: URL. */
export function loadSvgSource(uri: string): string {
  if (uri.startsWith('data:')) {
    const commaIndex = uri.indexOf(',')
    if (commaIndex === -1) {
      throw new Error('Malformed data: URL')
    }
    // e.g., 'image/svg+xml;base64'
    const header = uri.substring(5, commaIndex)
    const data = uri.substring(commaIndex + 1)

    return header.includes(';base64') ? Buffer.from(data, 'base64').toString('utf-8') : decodeURIComponent(data)
  }

  if (uri.startsWith('file://')) {
    uri = fileURLToPath(uri)
  }

  const resolved = path.isAbsolute(uri) ? uri : path.resolve(process.cwd(), uri)
  if (!fs.existsSync(resolved)) {
    throw new Error(`SVG file not found: ${resolved}`)
  }
  return fs.readFileSync(resolved, 'utf-8')
}
