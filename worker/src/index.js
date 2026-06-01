// Players to track — tracker is their Ubisoft username
const PLAYERS = [
  { name: 'Grant', tracker: 'Eh_Grant' },
  { name: 'Peej',  tracker: 'Eh_Peej' },
  { name: 'Hound', tracker: 'Eh_Hound' },
  { name: 'Smigs', tracker: 'Eh_tooten' },
  { name: 'Sarge', tracker: 'Eh_SiegeyBodeez' },
]

// Update this each season start (Y11S1 = 41).
const CURRENT_SEASON = 41

const API_BASE = 'https://r6data.com/api/stats'
const PLATFORM = 'uplay'

function computeFlag(rounds, winRate) {
  if (rounds < 10) return ''
  if (winRate >= 60) return '⭐'
  if (winRate >= 50) return '✅'
  if (winRate < 38)  return '⚠️'
  return ''
}

async function fetchPlayerStats(tracker, apiKey) {
  const headers = { 'api-key': apiKey }
  const base = `${API_BASE}?nameOnPlatform=${encodeURIComponent(tracker)}&platformType=${PLATFORM}`

  const [statsRes, seasonalRes, operatorRes] = await Promise.all([
    fetch(`${base}&type=stats`,                                   { headers }),
    fetch(`${base}&type=seasonalStats`,                           { headers }),
    fetch(`${base}&type=operatorStats&seasonNumber=${CURRENT_SEASON}`, { headers }),
  ])

  if (!statsRes.ok)    throw new Error(`stats ${statsRes.status}`)
  if (!seasonalRes.ok) throw new Error(`seasonal ${seasonalRes.status}`)
  if (!operatorRes.ok) throw new Error(`operators ${operatorRes.status}`)

  return Promise.all([statsRes.json(), seasonalRes.json(), operatorRes.json()])
}

function transformStats(rawStats, rawSeasonal, rawOperators) {
  // Rank + RP from the most recent point in the seasonal history
  const history = rawSeasonal?.data?.history?.data ?? []
  const latest  = history.at(-1)?.[1]
  const rank    = latest?.metadata?.rank   ?? null
  const rp      = latest?.value != null ? String(latest.value) : null

  // General stats — field names confirmed from r6data.com docs examples
  const s        = rawStats?.data ?? {}
  const kd       = s.kd               != null ? String(s.kd)                  : null
  const kills    = s.kills             != null ? String(s.kills)               : null
  const deaths   = s.deaths            != null ? String(s.deaths)              : null
  const winRate  = s.winRate           != null ? `${s.winRate}%`               : null
  const matches  = s.matchesPlayed     != null ? String(s.matchesPlayed)       : null
  const hs       = s.headshotPercentage != null ? String(s.headshotPercentage) : null

  // Operator breakdown — split by side, sorted by volume
  const ops = rawOperators?.operators ?? []

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
    stats:     { rank, rp, kd, kills, deaths, winRate, matches, hs },
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
        console.log(`✓ ${player.name} updated`)
      } catch (err) {
        console.error(`✗ ${player.name} failed:`, err.message)
        failed.push(player.name)
      }
    }

    if (failed.length) {
      console.error('Failed:', failed.join(', '))
    }
  },
}
