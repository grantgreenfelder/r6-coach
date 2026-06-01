// Generates public/sitemap.xml from the committed data. Runs before vite build
// (which copies public/ into dist/). Defensive: never throws, never blocks build.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://departmentofeh.org'

function readJson(rel) {
  try { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) } catch { return null }
}

try {
  const urls = ['/', '/players', '/maps', '/operators']

  const players = readJson('src/data/players.json')
  if (players) {
    for (const p of [...(players.mainStack || []), ...(players.bTeam || []), ...(players.other || [])]) {
      if (p?.name) urls.push(`/players/${encodeURIComponent(p.name)}`)
    }
  }

  const maps = readJson('src/data/maps.json')
  if (Array.isArray(maps)) {
    for (const m of maps) if (m?.name) urls.push(`/maps/${encodeURIComponent(m.name)}`)
  }

  const ops = readJson('src/data/operators.json')
  if (ops) {
    for (const o of [...(ops.atk || []), ...(ops.def || [])]) {
      if (o?.name) urls.push(`/operators/${encodeURIComponent(o.name)}`)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const body = urls.map(u =>
    `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(join(ROOT, 'public/sitemap.xml'), xml)
  console.log(`✓ sitemap.xml — ${urls.length} URLs`)
} catch (err) {
  console.warn('⚠ sitemap generation skipped:', err.message)
}
