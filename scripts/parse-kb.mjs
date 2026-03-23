/**
 * KB Parser — reads markdown files from the R6 Siege coaching Knowledge Base
 * and outputs structured JSON for the React app.
 *
 * Run: node scripts/parse-kb.mjs
 * Output: src/data/*.json
 */

import fs from 'fs'
import path from 'path'

const KB = '/sessions/loving-inspiring-johnson/mnt/Claude/R6 Siege Coach/Knowledge Base'
const OUT = path.resolve('src/data')

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8') } catch { return '' }
}

function parseMarkdownTable(text) {
  const lines = text.split('\n')
  const tableLines = lines.filter(l => l.trim().startsWith('|') && !l.includes('---'))
  if (tableLines.length < 2) return []
  const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean)
  return tableLines.slice(1).map(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cells[i] || '' })
    return obj
  }).filter(row => Object.values(row).some(v => v))
}

function extractSection(content, heading) {
  const lines = content.split('\n')
  const startIdx = lines.findIndex(l => l.match(new RegExp(`^#{1,3}\\s+${heading}`, 'i')))
  if (startIdx === -1) return ''
  const level = lines[startIdx].match(/^(#+)/)[1].length
  let endIdx = lines.findIndex((l, i) => i > startIdx && l.match(new RegExp(`^#{1,${level}}\\s`)))
  if (endIdx === -1) endIdx = lines.length
  return lines.slice(startIdx + 1, endIdx).join('\n').trim()
}

function extractStatus(content) {
  if (content.includes('✅')) return 'developed'
  if (content.includes('⚠️')) return 'partial'
  return 'not-developed'
}

function extractMapRating(ratingText) {
  if (!ratingText) return 'unknown'
  const t = ratingText.toLowerCase()
  if (t.includes('protect') || t.includes('strong')) return 'strong'
  if (t.includes('moderate')) return 'moderate'
  if (t.includes('weak')) return 'weak'
  if (t.includes('avoid')) return 'avoid'
  return 'unknown'
}

// ─── Players ─────────────────────────────────────────────────────────────────

function parsePlayer(name) {
  const dir = path.join(KB, 'PLAYERS', name)
  if (!fs.existsSync(dir)) return null

  const profile = readFile(path.join(dir, 'PROFILE.md'))
  const coaching = readFile(path.join(dir, 'COACHING.md'))

  // Find latest season file
  const files = fs.readdirSync(dir)
  const seasonFiles = files.filter(f => f.match(/Y\d+S\d+\.md/)).sort().reverse()
  const latestSeason = seasonFiles[0] ? readFile(path.join(dir, seasonFiles[0])) : ''
  const seasonName = seasonFiles[0]?.replace('.md', '') || 'Y11S1'

  // Extract tracker username
  const trackerMatch = profile.match(/Tracker[:\*\s]+([A-Za-z0-9_\-]+)/i) ||
                        profile.match(/\*\*Tracker:\*\*\s*([A-Za-z0-9_\-]+)/)
  const tracker = trackerMatch ? trackerMatch[1].trim() : ''

  // Extract team
  const teamMatch = profile.match(/\*\*Team:\*\*\s*(Main|B Team|C Team)/i)
  const team = teamMatch ? teamMatch[1] : 'Main'

  // Extract role
  const roleMatch = profile.match(/\*\*Role[^:]*:\*\*\s*([^\n]+)/) ||
                    profile.match(/Role[^:]*:\*\*\s*([^\n]+)/)
  const role = roleMatch ? roleMatch[1].replace(/[*_]/g, '').trim() : ''

  // Extract top ops from season file ATK/DEF identity lines
  // e.g. "**ATK identity:** Ash is the primary ATK pick (29r / 44.8% / 1.56 K/D). Secondary: Twitch (27r / 40.7%)."
  // → "Ash / Twitch"
  function extractOpsFromIdentity(content, side) {
    // "**ATK identity:** Ash is the primary ATK pick (29r / 44.8%). Secondary: Twitch (27r / 40.7%)."
    const reWithSecondary = new RegExp(`\\*\\*${side} identity:\\*\\*\\s*(\\w+) is the primary[^S]*Secondary:\\s*(\\w+)`, 'i')
    const m = content.match(reWithSecondary)
    if (m) return `${m[1]} / ${m[2]}`
    const rePrimary = new RegExp(`\\*\\*${side} identity:\\*\\*\\s*(\\w+) is the primary`, 'i')
    const mp = content.match(rePrimary)
    return mp ? mp[1] : ''
  }
  const atkOps = extractOpsFromIdentity(latestSeason, 'ATK')
  const defOps = extractOpsFromIdentity(latestSeason, 'DEF')

  // Extract stats from season file — KB uses a | Stat | Value | table under ## Core Stats
  const coreStatsSection = extractSection(latestSeason, 'Core Stats')
  const coreStatsRows = parseMarkdownTable(coreStatsSection)
  // Build a case-insensitive lookup: { rank: "Emerald III", "k/d": "1.19", ... }
  const statsLookup = {}
  for (const row of coreStatsRows) {
    const key = (row['Stat'] || row['stat'] || '').toLowerCase().trim()
    const val = (row['Value'] || row['value'] || '').trim()
    if (key) statsLookup[key] = val
  }
  // Fallback inline regexes for non-table formats
  const rankFallback = latestSeason.match(/\*\*Rank[:\*\s]+([^\n|*]+)/)
  const kdFallback   = latestSeason.match(/\*\*K\/D:\*\*\s*([\d.]+)/)
  const wrFallback   = latestSeason.match(/\*\*Win Rate:\*\*\s*([\d.%]+)/)
  const mFallback    = latestSeason.match(/\*\*Matches:\*\*\s*(\d+)/)
  const rpFallback   = latestSeason.match(/\*\*RP:\*\*\s*([\d,]+)/)

  // Extract top coaching priorities
  const coachingLines = coaching.split('\n')
    .filter(l => l.match(/^\d+\.|^-\s|\*\*/) && l.length > 10)
    .slice(0, 3)
    .map(l => l.replace(/^[\d\.\-\*\s]+/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.length > 5)

  return {
    name,
    tracker,
    team,
    role,
    atkOps,
    defOps,
    season: seasonName,
    stats: {
      rank:    statsLookup['rank']       || (rankFallback ? rankFallback[1].replace(/[*_]/g,'').trim() : '—'),
      rp:      (statsLookup['rp']        || (rpFallback   ? rpFallback[1] : '—')).replace(/,/g,''),
      kd:      statsLookup['k/d']        || (kdFallback   ? kdFallback[1] : '—'),
      winRate: statsLookup['win rate']   || (wrFallback   ? wrFallback[1] : '—'),
      matches: statsLookup['matches']    || (mFallback    ? mFallback[1]  : '—'),
    },
    coachingPriorities: coachingLines,
    profileContent: profile,
    coachingContent: coaching,
    seasonContent: latestSeason
      .replace(/\*\*\[ATK\]\*\*/g, '**Attack**')
      .replace(/\*\*\[DEF\]\*\*/g, '**Defense**')
      .replace(/\[ATK\]/g, 'Attack')
      .replace(/\[DEF\]/g, 'Defense'),
    mapPerformance: (() => {
      const section = extractSection(latestSeason, 'Map Performance')
      return parseMarkdownTable(section).map(row => ({
        map: (row['Map'] || '').trim(),
        matches: parseInt(row['Matches'] || '0', 10) || 0,
        winRate: parseFloat((row['Win%'] || row['Win Rate'] || '0').replace('%', '')) || 0,
      })).filter(r => r.map && r.matches > 0)
    })(),
  }
}

function buildPlayersData() {
  const playersDir = path.join(KB, 'PLAYERS')
  const names = fs.readdirSync(playersDir).filter(n =>
    fs.statSync(path.join(playersDir, n)).isDirectory()
  )

  const mainStackOrder = ['Grant', 'Peej', 'Hound', 'Smigs', 'Sarge']
  const bTeamOrder = ['Slug', 'Krafty', 'Bob', 'Hunter']

  const all = names.map(parsePlayer).filter(Boolean)
  const mainStack = mainStackOrder.map(n => all.find(p => p.name === n)).filter(Boolean)
  const bTeam = bTeamOrder.map(n => all.find(p => p.name === n)).filter(Boolean)
  const other = all.filter(p => !mainStackOrder.includes(p.name) && !bTeamOrder.includes(p.name))

  return { mainStack, bTeam, other }
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

function parseMapStrats(mapName) {
  const mapDir = path.join(KB, 'MAPS', mapName)
  if (!fs.existsSync(mapDir)) return []

  const files = fs.readdirSync(mapDir)
  const stratFiles = files.filter(f => f.match(/^(ATK|DEF)_/))

  return stratFiles.map(filename => {
    const content = readFile(path.join(mapDir, filename))
    const side = filename.startsWith('ATK') ? 'ATK' : 'DEF'
    const siteName = filename.replace(/^(ATK|DEF)_/, '').replace(/\.md$/, '').replace(/_/g, ' / ')

    // Parse role table
    const tableSection = content.split('\n').filter(l => l.includes('|')).join('\n')
    const roles = parseMarkdownTable(tableSection)

    return {
      filename,
      side,
      site: siteName,
      status: extractStatus(content),
      roles,
      content,
    }
  }).sort((a, b) => a.side.localeCompare(b.side) || a.site.localeCompare(b.site))
}

function buildMapsData(playersData) {
  const mapsDir = path.join(KB, 'MAPS')
  const mapNames = fs.readdirSync(mapsDir).filter(n =>
    fs.statSync(path.join(mapsDir, n)).isDirectory()
  ).sort()

  // Load STACK_05 for ratings
  const stack05 = readFile(path.join(KB, 'STACK', 'STACK_05_MAP_VETO.md'))

  // Build a map-name → { totalMatchWeight, totalWinWeight } lookup from main stack players
  const winRateByMap = {}
  for (const player of playersData.mainStack) {
    for (const row of (player.mapPerformance || [])) {
      // Normalize map name: "Nighthaven Labs" → "Nighthaven_Labs", "Kafe Dostoyevsky" → "Kafe_Dostoyevsky"
      const key = row.map.replace(/ /g, '_')
      if (!winRateByMap[key]) winRateByMap[key] = { weightedSum: 0, totalMatches: 0 }
      winRateByMap[key].weightedSum += row.winRate * row.matches
      winRateByMap[key].totalMatches += row.matches
    }
  }

  return mapNames.map(mapName => {
    const mapDir = path.join(KB, 'MAPS', mapName)
    const overview = readFile(path.join(mapDir, '_OVERVIEW.md'))
    const reference = readFile(path.join(mapDir, `${mapName}.md`))
    const strats = parseMapStrats(mapName)

    // Find rating in STACK_05
    const ratingMatch = stack05.match(new RegExp(`\\|\\s*\\*{0,2}${mapName.replace(/_/g, '[_ ]')}\\*{0,2}\\s*\\|\\s*([^|]+)\\|`,'i'))
    const ratingRaw = ratingMatch ? ratingMatch[1].trim() : ''
    const rating = extractMapRating(ratingRaw)
    const ratingLabel = ratingRaw.replace(/[✅⚠️❌🔲]/g, '').trim() || '—'

    const devCount = strats.filter(s => s.status === 'developed').length
    const partialCount = strats.filter(s => s.status === 'partial').length

    // Team win% for this map (weighted average across main stack players)
    // Normalize: folder may have spaces or underscores; player data always has spaces → normalize both to underscores
    const wr = winRateByMap[mapName.replace(/ /g, '_')]
    const teamWinRate = wr && wr.totalMatches > 0
      ? Math.round((wr.weightedSum / wr.totalMatches) * 10) / 10
      : null
    const teamWinRateMatches = wr ? wr.totalMatches : 0

    return {
      name: mapName,
      displayName: mapName.replace(/_/g, ' '),
      rating,
      ratingLabel,
      stratCount: { total: strats.length, developed: devCount, partial: partialCount },
      teamWinRate,
      teamWinRateMatches,
      strats,
      overviewContent: overview,
      referenceContent: reference,
    }
  })
}

// ─── Stack / Team ─────────────────────────────────────────────────────────────

function buildStackData() {
  const stack01 = readFile(path.join(KB, 'STACK', 'STACK_01_MAIN_STACK.md'))
  const stack05 = readFile(path.join(KB, 'STACK', 'STACK_05_MAP_VETO.md'))
  const meta04 = readFile(path.join(KB, 'META', 'META_04_RIS.md'))

  // Extract RIS scores - look for table rows
  const risTable = parseMarkdownTable(
    meta04.split('\n').filter(l => l.includes('|')).join('\n')
  )

  // Extract coaching items from STACK_01
  const coachingSection = extractSection(stack01, 'Priority Coaching Items')

  return {
    stack01Content: stack01,
    stack05Content: stack05,
    meta04Content: meta04,
    risScores: risTable,
    coachingItems: coachingSection,
  }
}

// ─── Session Handoff ─────────────────────────────────────────────────────────

function buildHandoffData() {
  const handoffPath = path.join(KB, '..', 'SESSION_HANDOFF.md')
  const content = readFile(handoffPath)
  return { content }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('📖 Parsing Knowledge Base...')

const players = buildPlayersData()
console.log(`  ✅ Players: ${players.mainStack.length} main stack, ${players.bTeam.length} B Team`)

const maps = buildMapsData(players)
console.log(`  ✅ Maps: ${maps.length} maps, ${maps.reduce((a, m) => a + m.strats.length, 0)} strat files`)

const stack = buildStackData()
console.log(`  ✅ Stack/team data parsed`)

const handoff = buildHandoffData()
console.log(`  ✅ Session handoff parsed`)

fs.writeFileSync(path.join(OUT, 'players.json'), JSON.stringify(players, null, 2))
fs.writeFileSync(path.join(OUT, 'maps.json'), JSON.stringify(maps, null, 2))
fs.writeFileSync(path.join(OUT, 'stack.json'), JSON.stringify(stack, null, 2))
fs.writeFileSync(path.join(OUT, 'handoff.json'), JSON.stringify(handoff, null, 2))

// Write a metadata file with last parse timestamp
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({
  parsedAt: new Date().toISOString(),
  playerCount: players.mainStack.length + players.bTeam.length,
  mapCount: maps.length,
  stratCount: maps.reduce((a, m) => a + m.strats.length, 0),
}, null, 2))

console.log(`\n✅ Done — data written to src/data/`)
