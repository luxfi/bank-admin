// Zero-dependency static file server for the built SPA (dist/).
// No nginx, no caddy — a tiny Node http server with SPA fallback, per the
// Hanzo stack rule. Serves on 0.0.0.0:$PORT (default 3000); unknown paths
// that are not files fall back to index.html so client-side routing works.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const PORT = Number(process.env.PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
}

async function send(res, status, body, type, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': type, ...extraHeaders })
  res.end(body)
}

async function tryFile(path) {
  try {
    const s = await stat(path)
    if (s.isFile()) return await readFile(path)
  } catch {
    /* not a file */
  }
  return null
}

const server = createServer(async (req, res) => {
  try {
    // Normalize + prevent path traversal.
    const url = new URL(req.url || '/', 'http://localhost')
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'
    const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
    const filePath = join(ROOT, rel)

    if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain')

    // Static asset?
    const file = await tryFile(filePath)
    if (file) {
      const ext = extname(filePath)
      const cache = filePath.includes(`${'/'}assets/`)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache'
      return send(res, 200, file, MIME[ext] || 'application/octet-stream', {
        'Cache-Control': cache,
      })
    }

    // SPA fallback → index.html (200 so the probe on "/" and deep links work).
    const index = await tryFile(join(ROOT, 'index.html'))
    if (index) return send(res, 200, index, MIME['.html'], { 'Cache-Control': 'no-cache' })

    return send(res, 404, 'Not found', 'text/plain')
  } catch (err) {
    return send(res, 500, 'Internal error', 'text/plain')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`bank-admin static server listening on 0.0.0.0:${PORT}`)
})
