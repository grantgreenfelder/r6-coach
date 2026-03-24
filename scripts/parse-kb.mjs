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
  if (t.includes('situational')) return 'moderate'
  if (t.includes('mixed') || t.includes('weak')) return 'weak'
  if (t.includes('hard ban') || t.includes('avoid')) return 'avoid'
  return 'unknown'
}

// ─── Players ─────────────────────────────────────────────────────────────────

function parsePlayer(name) {
  const dir = path.join(KB, 'PLAYERS', name)
  if (!fs.existsSync(dir)) return null

  const profile = readFile(path.join(dir, 'PROFILE.md'))
  const coaching = readFile(path.join(dir, 'COACHING.md'))

  // Find season files (sorted newest first)
  const files = fs.readdirSync(dir)
  const seasonFiles = files.filter(f => f.match(/Y\d+S\d+\.md/)).sort().reverse()
  const latestSeason = seasonFiles[0] ? readFile(path.join(dir, seasonFiles[0])) : ''
  const seasonName = seasonFiles[0]?.replace('.md', '') || 'Y11S1'
  const prevSeasonRaw = seasonFiles[1] ? readFile(path.join(dir, seasonFiles[1])) : ''
  const prevSeasonName = seasonFiles[1]?.replace('.md', '') || ''

  // Extract tracker username
  const trackerMatch = profile.match(/Tracker[:\*\s]+([A-Za-z0-9_\-]+)/i) ||
                        profile.match(/\*\*Tracker:\*\*\s*([A-Za-z0-9_\-]+)/)
  const tracker = trackerMatch ? trackerMatch[1].trim() : ''

  // Extract team
  const teamMatch = profile.match(/\*\*Team:\*\*\s*(Main|B Team|C Team)/i)
  const team = teamMatch ? teamMatch[1] : 'Main'

  // Extract role from Identity → **Role fit:** for a full descriptive label
  const identitySection = extractSection(profile, 'Identity')
  const roleFitMatch = identitySection.match(/\*\*Role fit:\*\*\s*([^\n]+)/)
  const role = roleFitMatch ? roleFitMatch[1].replace(/[*_]/g, '').trim() : ''

  // Extract bio from Identity → **Strengths:** as a playstyle description
  const strengthsMatch = identitySection.match(/\*\*Strengths?:\*\*\s*([^\n]+)/)
  const bio = strengthsMatch ? strengthsMatch[1].replace(/[*_]/g, '').trim() : ''

  // Extract top ops from season file ATK/DEF identity lines
  // e.g. "**ATK identity:** Ash is the primary ATK pick (29r / 44.8% / 1.56 K/D). Secondary: Twitch (27r / 40.7%)."
  // → "Ash / Twitch"
  function extractOpsFromIdentity(content, side) {
    // Y11S1 format: "**ATK identity:** Ash is the primary ATK pick (29r / 44.8%). Secondary: Twitch (27r / 40.7%)."
    const reWithSecondary = new RegExp(`\\*\\*${side} identity:\\*\\*\\s*(\\w+) is the primary[^S]*Secondary:\\s*(\\w+)`, 'i')
    const m = content.match(reWithSecondary)
    if (m) return `${m[1]} / ${m[2]}`
    const rePrimary = new RegExp(`\\*\\*${side} identity:\\*\\*\\s*(\\w+) is the primary`, 'i')
    const mp = content.match(rePrimary)
    if (mp) return mp[1]
    // Y10S4 / older format: extract top 2 ops from numbered list under **[ATK]** or **[DEF]**
    // e.g. "1. Amaru — 78r | 52.6% | 1.38\n2. Thatcher — 42r..."
    const sideTag = side === 'ATK' ? '\\[ATK\\]' : '\\[DEF\\]'
    const blockRe = new RegExp(`\\*\\*${sideTag}\\*\\*[\\s\\S]*?(?=\\*\\*\\[|$)`, 'i')
    const block = content.match(blockRe)
    if (block) {
      const opLines = block[0].match(/^\d+\.\s+(\w+)\s+—/gm)
      if (opLines && opLines.length > 0) {
        const ops = opLines.slice(0, 2).map(l => l.match(/^\d+\.\s+(\w+)/)[1])
        return ops.join(' / ')
      }
    }
    return ''
  }
  const atkOps = extractOpsFromIdentity(latestSeason, 'ATK')
  const defOps = extractOpsFromIdentity(latestSeason, 'DEF')
  const prevAtkOps = extractOpsFromIdentity(prevSeasonRaw, 'ATK')
  const prevDefOps = extractOpsFromIdentity(prevSeasonRaw, 'DEF')

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

  // Extract prev-season (Y10S4) stats using same logic
  const prevStatsLookup = {}
  if (prevSeasonRaw) {
    const prevCoreStatsSection = extractSection(prevSeasonRaw, 'Core Stats')
    const prevCoreStatsRows = parseMarkdownTable(prevCoreStatsSection)
    for (const row of prevCoreStatsRows) {
      const key = (row['Stat'] || row['stat'] || '').toLowerCase().trim()
      const val = (row['Value'] || row['value'] || '').trim()
      if (key) prevStatsLookup[key] = val
    }
  }

  // Extract top coaching priorities from the Priorities section (numbered bold items)
  // Tries "Y11S1 Priorities", "Priorities", "What to Work On" — falls back to any numbered bold line
  const prioritiesSection =
    extractSection(coaching, 'Y\\d+S\\d+ Priorities') ||
    extractSection(coaching, 'Priorities') ||
    extractSection(coaching, 'Areas to Work On') ||
    coaching
  const coachingLines = prioritiesSection.split('\n')
    .filter(l => l.match(/^\*\*\d+\./) && !l.includes('~~'))   // **1. Text** format, skip strikethrough
    .slice(0, 3)
    .map(l => {
      // "**1. Protect your best maps in ban phase.**" → "Protect your best maps in ban phase"
      const m = l.match(/^\*\*\d+\.\s+([^*]+)\*\*/)
      return m ? m[1].replace(/\.$/, '').trim() : l.replace(/^\*\*\d+\.\s*/, '').replace(/\*\*/g, '').trim()
    })
    .filter(l => l.length > 5)

  return {
    name,
    tracker,
    team,
    role,
    bio,
    atkOps,
    defOps,
    season: seasonName,
    stats: {
      rank:    statsLookup['rank']       || (rankFallback ? rankFallback[1].replace(/[*_]/g,'').trim() : '—'),
      rp:      (statsLookup['rp']        || (rpFallback   ? rpFallback[1] : '—')).replace(/,/g,''),
      kd:      statsLookup['k/d']        || (kdFallback   ? kdFallback[1] : '—'),
      winRate: statsLookup['win rate']   || (wrFallback   ? wrFallback[1] : '—'),
      matches: statsLookup['matches']    || (mFallback    ? mFallback[1]  : '—'),
      ris:     statsLookup['ris']        || '—',
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
    prevSeason: prevSeasonName,
    prevSeasonStats: prevSeasonName ? {
      rank:    (prevStatsLookup['rank']     || '—').replace(/[*_]/g, '').trim(),
      rp:      (prevStatsLookup['rp']       || '—').replace(/,/g, ''),
      kd:      prevStatsLookup['k/d']       || '—',
      winRate: prevStatsLookup['win rate']  || '—',
      matches: prevStatsLookup['matches']   || '—',
      ris:     (prevStatsLookup['ris']      || '—').replace(/\s*\(.*?\)/g, '').trim(),
    } : null,
    prevSeasonAtkOps: prevAtkOps,
    prevSeasonDefOps: prevDefOps,
    prevSeasonMapPerformance: (() => {
      if (!prevSeasonRaw) return []
      const section = extractSection(prevSeasonRaw, 'Map Performance')
      return parseMarkdownTable(section).map(row => ({
        map: (row['Map'] || '').trim(),
        matches: parseInt(row['Matches'] || '0', 10) || 0,
        winRate: parseFloat((row['Win%'] || row['Win Rate'] || '0').replace('%', '')) || 0,
      })).filter(r => r.map && r.matches > 0)
    })(),
    prevSeasonContent: prevSeasonRaw
      .replace(/\*\*\[ATK\]\*\*/g, '**Attack**')
      .replace(/\*\*\[DEF\]\*\*/g, '**Defense**')
      .replace(/\[ATK\]/g, 'Attack')
      .replace(/\[DEF\]/g, 'Defense'),
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

  // Parse ranked pool membership from STACK_05 pool lists
  function extractPoolList(text, sectionHeader) {
    const re = new RegExp(`###\\s+${sectionHeader}[^\\n]*\\n([^\\n]+)`, 'i')
    const m = text.match(re)
    if (!m) return new Set()
    return new Set(
      m[1].split(',')
        .map(s => s.replace(/\s*_\([^)]*\)_/, '').trim())  // strip _(13 maps)_ suffix
        .filter(Boolean)
    )
  }
  const firstHalfMaps = extractPoolList(stack05, 'First Half Launch')
  const secondHalfMaps = extractPoolList(stack05, 'Second Half Pool')

  return mapNames.map(mapName => {
    const displayName = mapName.replace(/_/g, ' ')
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

    // Team win% for this map
    const wr = winRateByMap[mapName.replace(/ /g, '_')]
    const teamWinRate = wr && wr.totalMatches > 0
      ? Math.round((wr.weightedSum / wr.totalMatches) * 10) / 10
      : null
    const teamWinRateMatches = wr ? wr.totalMatches : 0

    // Ranked pool membership (match by display name since pool lists use display names)
    const inFirst = firstHalfMaps.has(displayName)
    const inSecond = secondHalfMaps.has(displayName)
    const rankedPool = inFirst && inSecond ? 'both' : inFirst ? 'first' : inSecond ? 'second' : null

    return {
      name: mapName,
      displayName,
      rating,
      ratingLabel,
      rankedPool,           // 'first' | 'second' | 'both' | null  (relative to full season)
      inRankedPool: inFirst,  // true = currently active in Y11S1 First Half (first || both)
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

  // Parse Team Focus section (team-wide items for session prep)
  const rawTeamFocusSection = extractSection(stack01, 'Team Focus')
  const teamFocusItems = rawTeamFocusSection
    .split('\n')
    .filter(l => !l.includes('~~'))
    .filter(l => !l.trim().startsWith('_'))
    .join('\n')
    .split(/\n(?=\d+\.\s)/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.match(/^\d+\.\s+\*\*/))
    .map(chunk => {
      const headline = chunk.match(/^\d+\.\s+\*\*([^*]+)\*\*/)
      const text = headline ? headline[1].trim() : chunk.replace(/^\d+\.\s*/, '').trim()
      const body = chunk.replace(/^\d+\.\s+\*\*[^*]+\*\*\s*[—-]?\s*/, '').split('\n')[0].trim()
      return { text, body: body.length > 5 ? body : '' }
    })
    .filter(item => item.text.length > 3)

  // Extract priority coaching items from STACK_01 (player-specific items for callouts)
  const KNOWN_PLAYERS = ['Grant', 'Peej', 'Hound', 'Smigs', 'Sarge', 'Slug', 'Krafty', 'Bob', 'Hunter']
  const rawCoachingSection = extractSection(stack01, 'Priority Coaching Items')
  const coachingItemsStructured = rawCoachingSection
    .split('\n')
    .filter(l => !l.includes('~~'))
    .filter(l => !l.trim().startsWith('_→') && !l.trim().startsWith('→'))
    .join('\n')
    .split(/\n(?=\d+\.\s)/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.match(/^\d+\.\s+\*\*/))
    .map(chunk => {
      const headline = chunk.match(/^\d+\.\s+\*\*([^*]+)\*\*/)
      const text = headline ? headline[1].replace(/\s*\([^)]*\)$/, '').trim() : chunk.replace(/^\d+\.\s*/, '').trim()
      const playerTag = KNOWN_PLAYERS.find(p => chunk.includes(p)) || null
      const body = chunk.replace(/^\d+\.\s+\*\*[^*]+\*\*\s*[—-]?\s*/, '').split('\n')[0].trim()
      return { text, body: body.length > 5 ? body : '', playerTag }
    })
    .filter(item => item.text.length > 3)

  const coachingItems = rawCoachingSection
    .split('\n')
    .filter(l => !l.includes('~~'))
    .filter(l => !l.trim().startsWith('_→') && !l.trim().startsWith('→'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    stack01Content: stack01,
    stack05Content: stack05,
    meta04Content: meta04,
    risScores: risTable,
    coachingItems,
    coachingItemsStructured,
    teamFocusItems,
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
