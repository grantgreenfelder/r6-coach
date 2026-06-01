const PLAYERS = [
  { name: 'Grant', tracker: 'Eh_Grant' },
  { name: 'Peej',  tracker: 'Eh_Peej' },
  { name: 'Hound', tracker: 'Eh_Hound' },
  { name: 'Smigs', tracker: 'Eh_tooten' },
  { name: 'Sarge', tracker: 'Eh_SiegeyBodeez' },
]

// Update at the start of each season (Y11S1 = 41)
const CURRENT_SEASON = 41

const API_BASE = 'https://r6data.com/api/stats'
const COMMON_PARAMS = 'platformType=uplay&platform_families=pc'

// r6data.com returns digit suffixes ("Emerald 1") — normalize to roman numerals
function normalizeRank(rank) {
  if (!rank) return null
  return rank
    .replace(/ 1$/, ' I').replace(/ 2$/, ' II').replace(/ 3$/, ' III')
    .replace(/ 4$/, ' IV').replace(/ 5$/, ' V')
}

function computeFlag(rounds, winRate) {
  if (rounds < 10) return ''
  if (winRate >= 60) return '⭐'
  if (winRate >= 50) return '✅'
  if (winRate < 38)  return '⚠️'
  return ''
}

async function fetchPlayerStats(tracker, apiKey) {
  const headers = { 'api-key': apiKey }
  const q = `nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_PARAMS}`

  const [statsRes, seasonalRes, operatorRes] = await Promise.all([
    fetch(`${API_BASE}?type=stats&${q}`,                                    { headers }),
    fetch(`${API_BASE}?type=seasonalStats&${q}`,                            { headers }),
    fetch(`${API_BASE}?type=operatorStats&${q}&seasonNumber=${CURRENT_SEASON}`, { headers }),
  ])

  if (!statsRes.ok)    throw new Error(`stats ${statsRes.status}`)
  if (!seasonalRes.ok) throw new Error(`seasonal ${seasonalRes.status}`)
  if (!operatorRes.ok) throw new Error(`operators ${operatorRes.status}`)

  return Promise.all([statsRes.json(), seasonalRes.json(), operatorRes.json()])
}

function transformStats(rawStats, rawSeasonal, rawOperators) {
  // ── Core stats (season-specific ranked data) ─────────────────────────────
  const rankedBoard = rawStats?.platform_families_full_profiles?.[0]
    ?.board_ids_full_profiles?.find(b => b.board_id === 'ranked')
  const seasonProfile = rankedBoard?.full_profiles
    ?.find(p => p.season_id === CURRENT_SEASON)?.profile

  const kills   = seasonProfile?.kills  ?? null
  const deaths  = seasonProfile?.deaths ?? null
  const wins    = seasonProfile?.wins   ?? null
  const losses  = seasonProfile?.losses ?? null
  const abandon = seasonProfile?.abandon ?? 0
  const rp      = seasonProfile?.rank_points ?? null

  const matches  = wins != null ? wins + losses + abandon : null
  const kd       = kills != null && deaths > 0 ? (kills / deaths).toFixed(2) : null
  const winRate  = matches > 0 ? ((wins / matches) * 100).toFixed(1) + '%' : null

  // ── Rank name (from seasonal history, latest entry) ──────────────────────
  const history = rawSeasonal?.data?.history?.data ?? []
  const rankRaw = history.at(-1)?.[1]?.metadata?.rank ?? null
  const rank    = normalizeRank(rankRaw)

  // ── Operator stats (all-time — API doesn't season-filter these) ──────────
  const ops = rawOperators?.operators ?? []

  // Derive overall HS% from operator totals
  const totalHeadshots = ops.reduce((s, o) => s + (o.headshots ?? 0), 0)
  const totalKills     = ops.reduce((s, o) => s + (o.kills ?? 0), 0)
  const hs = totalKills > 0 ? ((totalHeadshots / totalKills) * 100).toFixed(1) : null

  const makeOpList = side =>
    ops
      .filter(o => o.side === side)
      .sort((a, b) => b.roundsPlayed - a.roundsPlayed)
      .map(o => ({
        name:        o.operator,
        rounds:      o.roundsPlayed,
        winRate:     o.winPercent,
        kd:          o.kd,
        flag:        computeFlag(o.roundsPlayed, o.winPercent),
        smallSample: o.roundsPlayed < 10,
      }))

  return {
    stats: {
      rank:    rank    != null ? rank           : undefined,
      rp:      rp      != null ? String(rp)     : undefined,
      kd:      kd      != null ? kd             : undefined,
      kills:   kills   != null ? String(kills)  : undefined,
      deaths:  deaths  != null ? String(deaths) : undefined,
      winRate: winRate != null ? winRate        : undefined,
      matches: matches != null ? String(matches): undefined,
      hs:      hs      != null ? hs             : undefined,
    },
    operators: { atk: makeOpList('Attacker'), def: makeOpList('Defender') },
    updatedAt: new Date().toISOString(),
  }
}

export default {
  async scheduled(_event, env) {
    console.log('Stats update started:', new Date().toISOString())
    const failed = []

    for (const player of PLAYERS) {
      try {
        const [rawStats, rawSeasonal, rawOperators] = await fetchPlayerStats(player.tracker, env.R6DATA_API_KEY)
        const data = transformStats(rawStats, rawSeasonal, rawOperators)
        await env.R6_STATS.put(`player:${player.tracker}`, JSON.stringify(data))
        console.log(`✓ ${player.name} — rank: ${data.stats.rank}, kd: ${data.stats.kd}, wr: ${data.stats.winRate}`)
      } catch (err) {
        console.error(`✗ ${player.name} failed:`, err.message)
        failed.push(player.name)
      }
    }

    if (failed.length) console.error('Failed:', failed.join(', '))
  },
}
