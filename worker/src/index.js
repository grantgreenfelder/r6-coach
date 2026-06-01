const PLAYERS = [
  { name: 'Grant', tracker: 'Eh_Grant' },
  { name: 'Peej',  tracker: 'Eh_Peej' },
  { name: 'Hound', tracker: 'Eh_Hound' },
  { name: 'Smigs', tracker: 'Eh_tooten' },
  { name: 'Sarge', tracker: 'Eh_SiegeyBodeez' },
]

const API_BASE    = 'https://r6data.com/api/stats'
const COMMON_Q    = 'platformType=uplay&platform_families=pc'
const SMALL_SAMPLE = 10   // rounds threshold for smallSample flag

// Convert season number (e.g. 41) → season string (e.g. "Y11S1").
// Eliminates the hardcoded CURRENT_SEASON constant — auto-detected from API.
function seasonNumToStr(n) {
  return `Y${Math.ceil(n / 4)}S${((n - 1) % 4) + 1}`
}

// r6data.com returns "Emerald 1" style — normalize to roman numerals
function normalizeRank(rank) {
  if (!rank) return null
  return rank
    .replace(/ 1$/, ' I').replace(/ 2$/, ' II').replace(/ 3$/, ' III')
    .replace(/ 4$/, ' IV').replace(/ 5$/, ' V')
}

// ── RIS (Round Impact Score) ──────────────────────────────────────────────────
// Weighted composite of KDA, ESR, WR, ClutchWR, HS%. Scale: 25–75, baseline 50.
// Requires ≥30 matches; clutchWR substitutes neutral (20%) if <8 attempts.
const RIS_MIN_MATCHES       = 30
const RIS_MIN_CLUTCH_TRIES  = 8
const RIS_NEUTRAL_CLUTCH_WR = 20   // neutral stand-in when clutch attempts too low

function normRIS(x, lo, hi) {
  return Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
}

function computeRIS(matches, kda, esr, wr, clutchWR, clutchAttempts, hs) {
  if (!matches || matches < RIS_MIN_MATCHES) return null
  const cwrVal = clutchAttempts >= RIS_MIN_CLUTCH_TRIES ? clutchWR : RIS_NEUTRAL_CLUTCH_WR
  const composite =
    0.30 * normRIS(kda,    0.70, 2.00) +
    0.30 * normRIS(esr,    0.25, 0.70) +
    0.20 * normRIS(wr,     35,   60)   +
    0.10 * normRIS(cwrVal, 5,    35)   +
    0.10 * normRIS(hs,     20,   60)
  return Math.round((25 + 50 * composite) * 10) / 10
}

function computeFlag(rounds, winRate) {
  if (rounds < SMALL_SAMPLE) return ''
  if (winRate >= 60) return '⭐'
  if (winRate >= 50) return '✅'
  if (winRate < 38)  return '⚠️'
  return ''
}

function pct(n, d) {
  return d > 0 ? parseFloat((n / d * 100).toFixed(1)) : 0
}

// ── Fetch ────────────────────────────────────────────────────────────────────

async function fetchSeasonsStats(tracker, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=seasonsStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}`,
    { headers: { 'api-key': apiKey } }
  )
  if (!r.ok) throw new Error(`seasonsStats ${r.status}`)
  return r.json()
}

async function fetchSeasonalStats(tracker, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=seasonalStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}`,
    { headers: { 'api-key': apiKey } }
  )
  if (!r.ok) throw new Error(`seasonalStats ${r.status}`)
  return r.json()
}

async function fetchOperatorStats(tracker, seasonYear, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=operatorStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}&seasonYear=${seasonYear}&modes=ranked`,
    { headers: { 'api-key': apiKey } }
  )
  if (!r.ok) throw new Error(`operatorStats ${r.status}`)
  return r.json()
}

// ── Transform ────────────────────────────────────────────────────────────────

function transformPlayer(rawSeasons, rawSeasonal, rawOperators) {
  // ── Determine current season ──────────────────────────────────────────────
  const meta          = rawSeasons?.data?.metadata ?? {}
  const currentSeason = meta.currentSeason
  const level         = meta.clearanceLevel ?? null

  // ── Current season ranked segment ─────────────────────────────────────────
  const segments = rawSeasons?.data?.segments ?? []
  const currentSeg = segments.find(
    s => s.attributes?.season === currentSeason && s.attributes?.gamemode === 'pvp_ranked'
  )
  const cs = currentSeg?.stats ?? {}

  const kills   = cs.kills?.value        ?? null
  const deaths  = cs.deaths?.value       ?? null
  const wins    = cs.matchesWon?.value   ?? null
  const losses  = cs.matchesLost?.value  ?? null
  const matches = cs.matchesPlayed?.value ?? null
  const rp      = cs.rankPoints?.value   ?? null
  const maxRp   = cs.maxRankPoints?.value ?? null
  const kd      = cs.kdRatio?.value != null
    ? parseFloat(cs.kdRatio.value.toFixed(2)) : null

  const winRate = matches > 0
    ? parseFloat((wins / matches * 100).toFixed(1)) : null

  // ── Rank name from seasonal history ───────────────────────────────────────
  const history = rawSeasonal?.data?.history?.data ?? []
  const rank    = normalizeRank(history.at(-1)?.[1]?.metadata?.rank ?? null)

  // ── Operator stats + computed aggregates ──────────────────────────────────
  const ops = rawOperators?.operators ?? []

  let totalKills = 0, totalDeaths = 0, totalAssists = 0
  let totalHeadshots = 0
  let totalClutches = 0, totalClutchesLost = 0
  let totalFB = 0, totalFD = 0
  let totalAces = 0

  ops.forEach(o => {
    totalKills       += o.kills        ?? 0
    totalDeaths      += o.deaths       ?? 0
    totalAssists     += o.assists      ?? 0
    totalHeadshots   += o.headshots    ?? 0
    totalClutches    += o.clutches     ?? 0
    totalClutchesLost += o.clutchesLost ?? 0
    totalFB          += o.firstBloods  ?? 0
    totalFD          += o.firstDeaths  ?? 0
    totalAces        += o.aces         ?? 0
  })

  const hs             = totalKills > 0 ? parseFloat((totalHeadshots / totalKills * 100).toFixed(1)) : null
  const kda            = totalDeaths > 0 ? parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : null
  const esr            = (totalFB + totalFD) > 0 ? parseFloat((totalFB / (totalFB + totalFD)).toFixed(2)) : null
  const clutches       = totalClutches
  const clutchAttempts = totalClutches + totalClutchesLost
  const clutchWR       = clutchAttempts > 0
    ? parseFloat((totalClutches / clutchAttempts * 100).toFixed(1)) : null

  const ris = computeRIS(
    matches,
    kda    ?? 0,
    esr    ?? 0,
    winRate ?? 0,
    clutchWR ?? RIS_NEUTRAL_CLUTCH_WR,
    clutchAttempts,
    hs     ?? 0,
  )

  // ── Career history (ranked seasons only, most recent first) ───────────────
  const careerHistory = segments
    .filter(s => s.attributes?.gamemode === 'pvp_ranked' && s.metadata?.shortName)
    .map(s => {
      const st = s.stats ?? {}
      const m  = st.matchesPlayed?.value ?? 0
      const w  = st.matchesWon?.value    ?? 0
      return {
        season:  s.metadata.shortName,
        kd:      st.kdRatio?.value != null ? parseFloat(st.kdRatio.value.toFixed(2)) : null,
        wr:      m > 0 ? parseFloat((w / m * 100).toFixed(1)) : null,
        matches: m,
        rp:      st.rankPoints?.value    ?? null,
        maxRp:   st.maxRankPoints?.value ?? null,
        kills:   st.kills?.value         ?? null,
        deaths:  st.deaths?.value        ?? null,
      }
    })

  // ── Per-operator breakdown ─────────────────────────────────────────────────
  const makeOpList = side =>
    ops
      .filter(o => o.side === side)
      .sort((a, b) => b.roundsPlayed - a.roundsPlayed)
      .map(o => ({
        name:        o.operator,
        rounds:      o.roundsPlayed,
        winRate:     o.winPercent,
        kd:          o.kd,
        hs:          o.headshotPercent ?? null,
        clutches:    o.clutches ?? 0,
        clutchWR:    (o.clutches + o.clutchesLost) > 0
                       ? pct(o.clutches, o.clutches + o.clutchesLost) : 0,
        firstBloods: o.firstBloods ?? 0,
        firstDeaths: o.firstDeaths ?? 0,
        assists:     o.assists ?? 0,
        flag:        computeFlag(o.roundsPlayed, o.winPercent),
        smallSample: o.roundsPlayed < SMALL_SAMPLE,
      }))

  return {
    stats: {
      ...(rank    != null && { rank }),
      ...(rp      != null && { rp: String(rp) }),
      ...(maxRp   != null && { maxRp: String(maxRp) }),
      ...(kd      != null && { kd: String(kd) }),
      ...(kda     != null && { kda: String(kda) }),
      ...(kills   != null && { kills: String(kills) }),
      ...(deaths  != null && { deaths: String(deaths) }),
      ...(winRate != null && { winRate: winRate + '%' }),
      ...(matches != null && { matches: String(matches) }),
      ...(hs      != null && { hs: String(hs) }),
      ...(esr     != null && { esr: String(esr) }),
      ...(clutches > 0    && { clutches: String(clutches) }),
      ...(clutchWR != null && { clutchWR: String(clutchWR) }),
      ...(level   != null && { level: String(level) }),
      ...(totalAces > 0  && { aces: String(totalAces) }),
      ...(ris     != null && { ris: String(ris) }),
    },
    operators:      { atk: makeOpList('Attacker'), def: makeOpList('Defender') },
    careerHistory,
    updatedAt:      new Date().toISOString(),
  }
}

// ── Worker entry ─────────────────────────────────────────────────────────────

export default {
  async scheduled(_event, env) {
    console.log('Stats update started:', new Date().toISOString())
    const failed = []

    for (const player of PLAYERS) {
      try {
        // First fetch seasonsStats to detect the current season, then fan out
        const rawSeasons = await fetchSeasonsStats(player.tracker, env.R6DATA_API_KEY)
        const currentSeason = rawSeasons?.data?.metadata?.currentSeason
        if (!currentSeason) throw new Error('could not detect current season')

        const seasonYear = seasonNumToStr(currentSeason)
        const [rawSeasonal, rawOperators] = await Promise.all([
          fetchSeasonalStats(player.tracker, env.R6DATA_API_KEY),
          fetchOperatorStats(player.tracker, seasonYear, env.R6DATA_API_KEY),
        ])

        const data = transformPlayer(rawSeasons, rawSeasonal, rawOperators)
        await env.R6_STATS.put(`player:${player.tracker}`, JSON.stringify(data))
        console.log(
          `✓ ${player.name} — ${data.stats.rank ?? 'unranked'} | ` +
          `KD ${data.stats.kd} | WR ${data.stats.winRate} | ` +
          `KDA ${data.stats.kda} | ESR ${data.stats.esr} | ` +
          `Clutches ${data.stats.clutches} (${data.stats.clutchWR}%)`
        )
      } catch (err) {
        console.error(`✗ ${player.name} failed:`, err.message)
        failed.push(player.name)
      }
    }

    if (failed.length) console.error('Failed:', failed.join(', '))
  },
}
