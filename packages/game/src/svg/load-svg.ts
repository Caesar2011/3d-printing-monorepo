import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Loads SVG source from a file path, file:// URL, or data: URL. */
export function loadSvgSource(uri: string): string {
  if (uri.startsWith('data:')) {
    const commaIndex = uri.indexOf(',')
    if (commaIndex === -1) throw new Error('Malformed data: URL')
    const meta = uri.slice(0, commaIndex)
    const encoded = uri.slice(commaIndex + 1)
    return meta.includes(';base64') ? Buffer.from(encoded, 'base64').toString('utf-8') : decodeURIComponent(encoded)
  }

  if (uri.startsWith('file://')) {
    uri = fileURLToPath(uri)
  }

  const resolved = path.isAbsolute(uri) ? uri : path.resolve(process.cwd(), uri)
  if (!fs.existsSync(resolved)) throw new Error(`SVG file not found: ${resolved}`)
  return fs.readFileSync(resolved, 'utf-8')
}
