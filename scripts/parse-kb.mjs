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
    const cells = row.split('|').map(c => c.replace(/<br\s*\/?>/gi, ' · ').trim()).filter(Boolean)
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

function parseOperators(content) {
  if (!content) return { atk: [], def: [] }
  // Both Y11S1 and Y10S4 use **Attack** / **Defense** after the ATK/DEF replacements
  const lines = content.split('\n')

  let atkStart = -1, defStart = -1
  lines.forEach((l, i) => {
    if (/^\*\*Attack\*\*$/i.test(l.trim())) atkStart = i
    if (/^\*\*Defense\*\*$/i.test(l.trim())) defStart = i
  })

  function parseBlock(start, end) {
    if (start === -1) return []
    const block = end === -1 ? lines.slice(start + 1) : lines.slice(start + 1, end)
    return block
      .filter(l => /^\d+\.\s+.+—/.test(l.trim()))
      .map(l => {
        // Format: "1. OperatorName — 54r | 48.1% | 1.30 ⭐"
        const m = l.match(/^\d+\.\s+(.+?)\s+—\s+(\d+)r\s+\|\s+([\d.]+)%\s+\|\s+([\d.]+)\s*([⭐✅⚠️]*)/)
        if (!m) return null
        return {
          name: m[1].trim(),
          rounds: parseInt(m[2], 10),
          winRate: parseFloat(m[3]),
          kd: parseFloat(m[4]),
          flag: m[5]?.trim() || '',
        }
      })
      .filter(Boolean)
  }

  return {
    atk: parseBlock(atkStart, defStart),
    def: parseBlock(defStart, -1),
  }
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
    operators: (() => {
      const cleaned = latestSeason
        .replace(/\*\*\[ATK\]\*\*/g, '**Attack**')
        .replace(/\*\*\[DEF\]\*\*/g, '**Defense**')
        .replace(/\[ATK\]/g, 'Attack')
        .replace(/\[DEF\]/g, 'Defense')
      return parseOperators(cleaned)
    })(),
    mapPerformance: (() => {
      const section = extractSection(latestSeason, 'Map Performance')
      return parseMarkdownTable(section).map(row => ({
        map: (row['Map'] || '').trim(),
        matches: parseInt(row['Matches'] || '0', 10) || 0,
        winRate: parseFloat((row['Win%'] || row['Win Rate'] || '0').replace('%', '')) || 0,
        kd:     parseFloat(row['K/D'] || '0') || 0,
        atkWr:  parseFloat((row['Atk%'] || '0').replace('%', '')) || 0,
        defWr:  parseFloat((row['Def%'] || '0').replace('%', '')) || 0,
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
        kd:     parseFloat(row['K/D'] || '0') || 0,
        atkWr:  parseFloat((row['Atk%'] || '0').replace('%', '')) || 0,
        defWr:  parseFloat((row['Def%'] || '0').replace('%', '')) || 0,
      })).filter(r => r.map && r.matches > 0)
    })(),
    prevSeasonContent: prevSeasonRaw
      .replace(/\*\*\[ATK\]\*\*/g, '**Attack**')
      .replace(/\*\*\[DEF\]\*\*/g, '**Defense**')
      .replace(/\[ATK\]/g, 'Attack')
      .replace(/\[DEF\]/g, 'Defense'),
    prevSeasonOperators: (() => {
      if (!prevSeasonRaw) return { atk: [], def: [] }
      const cleaned = prevSeasonRaw
        .replace(/\*\*\[ATK\]\*\*/g, '**Attack**')
        .replace(/\*\*\[DEF\]\*\*/g, '**Defense**')
        .replace(/\[ATK\]/g, 'Attack')
        .replace(/\[DEF\]/g, 'Defense')
      return parseOperators(cleaned)
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

    // Parse role table from ## Roles section only (not Post-Plant or other tables)
    const rolesSection = extractSection(content, 'Roles')
    const roles = parseMarkdownTable(rolesSection)
      .filter(row => {
        const player = (row.Player || '').replace(/\*\*/g, '').trim()
        return player && !/^player$/i.test(player)
      })

    // Header metadata
    const formation   = content.match(/\*\*Formation:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''
    const siteContext = content.match(/\*\*Site Context:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''

    return {
      filename,
      side,
      site: siteName,
      status: extractStatus(content),
      roles,
      formation,
      siteContext,
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

  // Build per-season, per-map player stats arrays (all players: main stack + B team)
  // Season keys derived from each player's .season / .prevSeason properties
  const playerMapStats = {}   // { [season]: { [mapKey]: [{callsign, matches, winRate, kd, atkWr, defWr}] } }
  const allPlayers = [...(playersData.mainStack || []), ...(playersData.bTeam || [])]

  for (const player of allPlayers) {
    const callsign = player.name || player.callsign || '?'
    const curSeason  = player.season    || 'Y11S1'
    const prevSeason = player.prevSeason || 'Y10S4'

    // Current season map data
    for (const row of (player.mapPerformance || [])) {
      const key = row.map.replace(/ /g, '_')
      if (!playerMapStats[curSeason])        playerMapStats[curSeason]       = {}
      if (!playerMapStats[curSeason][key])   playerMapStats[curSeason][key]  = []
      playerMapStats[curSeason][key].push({
        callsign, matches: row.matches, winRate: row.winRate,
        kd: row.kd || 0, atkWr: row.atkWr || 0, defWr: row.defWr || 0,
      })
    }

    // Previous season map data
    if (prevSeason) {
      for (const row of (player.prevSeasonMapPerformance || [])) {
        const key = row.map.replace(/ /g, '_')
        if (!playerMapStats[prevSeason])       playerMapStats[prevSeason]      = {}
        if (!playerMapStats[prevSeason][key])  playerMapStats[prevSeason][key] = []
        playerMapStats[prevSeason][key].push({
          callsign, matches: row.matches, winRate: row.winRate,
          kd: row.kd || 0, atkWr: row.atkWr || 0, defWr: row.defWr || 0,
        })
      }
    }
  }

  // Derive the active season label (first player's .season field, fallback Y11S1)
  const activeSeason = playersData.mainStack?.[0]?.season || 'Y11S1'

  // Build Y10S4 weighted team avg by map (main stack only) for the tile context
  const winRateByMapY10S4 = {}
  for (const player of playersData.mainStack) {
    for (const row of (player.prevSeasonMapPerformance || [])) {
      const key = row.map.replace(/ /g, '_')
      if (!winRateByMapY10S4[key]) winRateByMapY10S4[key] = { weightedSum: 0, totalMatches: 0 }
      winRateByMapY10S4[key].weightedSum += row.winRate * row.matches
      winRateByMapY10S4[key].totalMatches += row.matches
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

    // Team win% for this map (current season — match-weighted across main stack)
    const mapKey = mapName.replace(/ /g, '_')
    const wr = winRateByMap[mapKey]
    const teamWinRate = wr && wr.totalMatches > 0
      ? Math.round((wr.weightedSum / wr.totalMatches) * 10) / 10
      : null
    const teamWinRateMatches = wr ? wr.totalMatches : 0
    const teamWinRateSeason  = activeSeason

    // Per-player stats by season (sorted by matches desc within each season)
    const statsForMap = {}
    for (const [season, byMap] of Object.entries(playerMapStats)) {
      const rows = (byMap[mapKey] || []).slice().sort((a, b) => b.matches - a.matches)
      if (rows.length > 0) statsForMap[season] = rows
    }

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
      teamWinRateSeason,
      playerStats: statsForMap,
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

// ─── Operators ────────────────────────────────────────────────────────────────

function buildOperatorsData(playersData) {
  // Load role / category mapping
  const rolesPath = path.join(KB, '../Scripts/operator-roles.json')
  let rolesConfig = { ATK: {}, DEF: {} }
  try { rolesConfig = JSON.parse(fs.readFileSync(rolesPath, 'utf8')) } catch (e) {
    console.warn('  ⚠️  operator-roles.json not found, categories will be "Unknown"')
  }

  // operator name → category (keyed by canonical KB filename sans .md)
  const categoryLookup = {}
  for (const [side, cats] of Object.entries(rolesConfig)) {
    if (side.startsWith('_')) continue
    for (const [cat, ops] of Object.entries(cats)) {
      for (const op of ops) categoryLookup[op] = cat
    }
  }

  // Alias table — tracker spelling → canonical KB name
  const ALIASES = {
    'Capitão': 'Capitao',
    'Nøkk': 'Nokk',
    'Jäger': 'Jager',
    'Skopós': 'Skopos',
    'Tubarão': 'Tubarao',
    'Solid Snake': 'Solid_Snake',
  }
  // Build reverse: canonical → aliases (for stats lookup)
  const reverseAliases = {}
  for (const [alias, canon] of Object.entries(ALIASES)) {
    if (!reverseAliases[canon]) reverseAliases[canon] = []
    reverseAliases[canon].push(alias)
  }

  // ── Build per-operator stats from all players ──────────────────────────────
  // opStats[canonicalName][season] = [{ player, rounds, winRate, kd }, ...]
  const opStats = {}
  function addStat(opName, season, playerName, entry) {
    const canon = ALIASES[opName] ?? opName
    if (!opStats[canon]) opStats[canon] = { y10s4: [], y11s1: [] }
    if (!opStats[canon][season]) opStats[canon][season] = []
    opStats[canon][season].push({ player: playerName, rounds: entry.rounds, winRate: entry.winRate, kd: entry.kd })
  }

  // Map a season name string (e.g. 'Y11S1') to the stats bucket key
  function seasonKey(name) {
    if (!name) return null
    const n = name.toUpperCase()
    if (n === 'Y11S1') return 'y11s1'
    if (n === 'Y10S4') return 'y10s4'
    return null
  }

  const allPlayers = [...playersData.mainStack, ...playersData.bTeam, ...playersData.other]
  for (const p of allPlayers) {
    // Use p.season to determine the correct bucket — avoids bucketing a player's
    // Y10S4 data as Y11S1 when their latest file is Y10S4 (e.g. D-Man)
    const curKey  = seasonKey(p.season)
    const prevKey = seasonKey(p.prevSeason)
    if (curKey) {
      for (const entry of (p.operators?.atk || []))  addStat(entry.name, curKey, p.name, entry)
      for (const entry of (p.operators?.def || []))  addStat(entry.name, curKey, p.name, entry)
    }
    if (prevKey) {
      for (const entry of (p.prevSeasonOperators?.atk || [])) addStat(entry.name, prevKey, p.name, entry)
      for (const entry of (p.prevSeasonOperators?.def || [])) addStat(entry.name, prevKey, p.name, entry)
    }
  }

  // ── Parse a single operator .md file ──────────────────────────────────────
  function parseOperatorFile(filePath, side) {
    const content = readFile(filePath)
    if (!content) return null
    const name = path.basename(filePath, '.md')

    // Profile table
    const profileRows = parseMarkdownTable(extractSection(content, 'Profile'))
    const profile = {}
    for (const row of profileRows) {
      const k = (row['Field'] || '').replace(/\*\*/g, '').trim().toLowerCase()
      const v = (row['Info'] || '').replace(/\*\*/g, '').trim()
      if (k === 'real name')    profile.realName    = v
      else if (k === 'ctu')     profile.ctu         = v
      else if (k === 'speed / armor') profile.speedArmor = v
      else if (k === 'role')    profile.role        = v
      else if (k === 'season added') profile.seasonAdded = v
    }

    // Gadget name from heading: "## Gadget — Breaching Round"
    const gadgetHeadingMatch = content.match(/^##\s+Gadget\s*[—\-:]\s*(.+)$/m)
    const gadgetName = gadgetHeadingMatch ? gadgetHeadingMatch[1].trim() : ''

    // Gadget description — first **Gadget:** bold line in section
    const gadgetSection = extractSection(content, 'Gadget')
    const gadgetDescMatch = gadgetSection.match(/\*\*Gadget:\*\*\s*([^\n]+)/)
    const gadgetDescription = gadgetDescMatch
      ? gadgetDescMatch[1].replace(/\*\*/g, '').trim()
      : gadgetSection.split('\n').find(l => l.trim().length > 30 && !l.startsWith('#') && !l.startsWith('>')) || ''

    // Key mechanics bullets
    const mechanicsSection = extractSection(content, 'Key Mechanics')
    const mechanics = mechanicsSection
      .split('\n')
      .filter(l => /^\s*[-*•]\s/.test(l))
      .map(l => l.replace(/^\s*[-*•]\s+/, '').replace(/\*\*/g, '').trim())
      .filter(Boolean)
      .slice(0, 8)

    // Usage tips bullets
    const tipsSection = extractSection(content, 'Usage Tips')
    const tips = tipsSection
      .split('\n')
      .filter(l => /^\s*[-*•]\s/.test(l))
      .map(l => l.replace(/^\s*[-*•]\s+/, '').replace(/\*\*/g, '').trim())
      .filter(Boolean)
      .slice(0, 6)

    // Loadout
    const loadoutSection = extractSection(content, 'Loadout')
    const primaries = parseMarkdownTable(extractSection(content, 'Primaries'))
      .map(r => ({ weapon: r['Weapon'] || '', type: r['Type'] || '', notes: r['Notes'] || '' }))
      .filter(r => r.weapon)
    const secondaries = parseMarkdownTable(extractSection(content, 'Secondaries'))
      .map(r => ({ weapon: r['Weapon'] || '', type: r['Type'] || '', notes: r['Notes'] || '' }))
      .filter(r => r.weapon)

    // Secondary gadgets list (bullets after "### Secondary Gadgets")
    const loadoutLines = loadoutSection.split('\n')
    const gadgetHeaderIdx = loadoutLines.findIndex(l => /^###\s+Secondary Gadgets/i.test(l))
    const secondaryGadgets = gadgetHeaderIdx >= 0
      ? loadoutLines.slice(gadgetHeaderIdx + 1)
          .filter(l => /^\s*[-*•]\s/.test(l))
          .map(l => l.replace(/^\s*[-*•]\s+/, '').trim())
          .filter(Boolean)
      : []

    // Coaching recommendation table + rationale
    const coachRecSection = extractSection(content, 'Coaching Recommendation')
    const coachRecRows = parseMarkdownTable(coachRecSection)
    const coachingRec = {}
    for (const row of coachRecRows) {
      const field = (row['Field'] || '').trim().toLowerCase()
      const config = (row['Config'] || '').trim()
      if (field && config) coachingRec[field] = config
    }
    const rationaleMatch = coachRecSection.match(/\*\*Rationale:\*\*\s*([^\n]+)/)
    if (rationaleMatch) coachingRec.rationale = rationaleMatch[1].trim()

    // Playstyle text (first paragraph, stripped)
    const playstyleRaw = extractSection(content, 'Playstyle')
    const playstyleText = playstyleRaw
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#'))
      .join(' ')
      .replace(/\*\*/g, '')
      .trim()
      .substring(0, 500)

    // Strengths / Weaknesses bullets
    function sectionBullets(heading, limit = 7) {
      return extractSection(content, heading)
        .split('\n')
        .filter(l => /^\s*[-*•]\s/.test(l))
        .map(l => l.replace(/^\s*[-*•]\s+/, '').replace(/\*\*/g, '').trim())
        .filter(Boolean)
        .slice(0, limit)
    }
    const strengths  = sectionBullets('Strengths')
    const weaknesses = sectionBullets('Weaknesses')

    // Stack Coaching Notes (plain text, stripped internal KB language)
    const stackNotesRaw = extractSection(content, 'Stack Coaching Notes')
    const stackNotes = stackNotesRaw
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('*Confidence'))
      .join(' ')
      .replace(/\*\*/g, '')
      .trim()
      .substring(0, 600)

    // Image URL — r6operators CDN (lowercase, no underscores/spaces)
    const imageKey = name.toLowerCase().replace(/_/g, '')
    const imageUrl = `https://r6operators.marcopixel.eu/icons/png/${imageKey}.png`

    // Stats — collect from opStats, also check alias variants
    const lookupNames = [name, ...(reverseAliases[name] || [])]
    const stats = { y11s1: [], y10s4: [] }
    for (const n of lookupNames) {
      if (opStats[n]) {
        for (const season of ['y11s1', 'y10s4']) {
          if (opStats[n][season]?.length) stats[season] = opStats[n][season]
        }
        break
      }
    }

    return {
      name,
      side,
      category: categoryLookup[name] || 'Unknown',
      imageUrl,
      profile,
      gadget: { name: gadgetName, description: gadgetDescription, mechanics, tips },
      loadout: { primaries, secondaries, secondaryGadgets, coachingRec },
      playstyle: playstyleText,
      strengths,
      weaknesses,
      stackNotes,
      stats,
    }
  }

  function loadSide(side) {
    const dir = path.join(KB, 'OPERATORS', side)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => parseOperatorFile(path.join(dir, f), side))
      .filter(Boolean)
  }

  // Sort by category order from rolesConfig, then alphabetically within category
  function sortOps(ops, sideConfig) {
    const catOrder = Object.keys(sideConfig)
    return ops.sort((a, b) => {
      const ai = catOrder.indexOf(a.category)
      const bi = catOrder.indexOf(b.category)
      const aIdx = ai === -1 ? 99 : ai
      const bIdx = bi === -1 ? 99 : bi
      if (aIdx !== bIdx) return aIdx - bIdx
      return a.name.localeCompare(b.name)
    })
  }

  const atk = sortOps(loadSide('ATK'), rolesConfig.ATK || {})
  const def = sortOps(loadSide('DEF'), rolesConfig.DEF || {})

  return {
    atk,
    def,
    atkCategories: Object.keys(rolesConfig.ATK || {}),
    defCategories: Object.keys(rolesConfig.DEF || {}),
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

const operators = buildOperatorsData(players)
console.log(`  ✅ Operators: ${operators.atk.length} ATK, ${operators.def.length} DEF`)

fs.writeFileSync(path.join(OUT, 'players.json'), JSON.stringify(players, null, 2))
fs.writeFileSync(path.join(OUT, 'maps.json'), JSON.stringify(maps, null, 2))
fs.writeFileSync(path.join(OUT, 'stack.json'), JSON.stringify(stack, null, 2))
fs.writeFileSync(path.join(OUT, 'handoff.json'), JSON.stringify(handoff, null, 2))
fs.writeFileSync(path.join(OUT, 'operators.json'), JSON.stringify(operators, null, 2))

// Write a metadata file with last parse timestamp
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({
  parsedAt: new Date().toISOString(),
  playerCount: players.mainStack.length + players.bTeam.length,
  mapCount: maps.length,
  stratCount: maps.reduce((a, m) => a + m.strats.length, 0),
  operatorCount: operators.atk.length + operators.def.length,
}, null, 2))

console.log(`\n✅ Done — data written to src/data/`)
