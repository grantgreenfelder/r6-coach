const PLAYERS = [
  { name: 'Grant', tracker: 'Eh_Grant' },
  { name: 'Peej',  tracker: 'Eh_Peej' },
  { name: 'Hound', tracker: 'Eh_Hound' },
  { name: 'Smigs', tracker: 'Eh_tooten' },
  { name: 'Sarge', tracker: 'Eh_SiegeyBodeez' },
]

// Y6S1 is season 21 — the earliest we track history from.
const HISTORY_START_SEASON = 21

const API_BASE   = 'https://r6data.com/api/stats'
const COMMON_Q   = 'platformType=uplay&platform_families=pc'
const SMALL_SAMPLE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

// Convert season number (e.g. 41) → "Y11S1"
function seasonNumToStr(n) {
  return `Y${Math.ceil(n / 4)}S${((n - 1) % 4) + 1}`
}

// Build array of all season strings from HISTORY_START_SEASON up to (not including) currentSeason
function pastSeasons(currentSeason) {
  const seasons = []
  for (let n = HISTORY_START_SEASON; n < currentSeason; n++) {
    seasons.push({ num: n, str: seasonNumToStr(n) })
  }
  return seasons
}

function normalizeRank(rank) {
  if (!rank) return null
  return rank
    .replace(/ 1$/, ' I').replace(/ 2$/, ' II').replace(/ 3$/, ' III')
    .replace(/ 4$/, ' IV').replace(/ 5$/, ' V')
}

// ── RIS ───────────────────────────────────────────────────────────────────────
const RIS_MIN_MATCHES      = 30
const RIS_MIN_CLUTCH_TRIES = 8
const RIS_NEUTRAL_CWR      = 20

function normRIS(x, lo, hi) {
  return Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
}

function computeRIS(matches, kda, esr, wr, clutchWR, clutchAttempts, hs) {
  if (!matches || matches < RIS_MIN_MATCHES) return null
  const cwrVal = clutchAttempts >= RIS_MIN_CLUTCH_TRIES ? clutchWR : RIS_NEUTRAL_CWR
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

// ── Shared operator aggregation ───────────────────────────────────────────────

function aggregateOps(ops) {
  let kills = 0, deaths = 0, assists = 0, headshots = 0
  let clutches = 0, clutchesLost = 0, fb = 0, fd = 0, aces = 0

  ops.forEach(o => {
    kills       += o.kills        ?? 0
    deaths      += o.deaths       ?? 0
    assists     += o.assists      ?? 0
    headshots   += o.headshots    ?? 0
    clutches    += o.clutches     ?? 0
    clutchesLost += o.clutchesLost ?? 0
    fb          += o.firstBloods  ?? 0
    fd          += o.firstDeaths  ?? 0
    aces        += o.aces         ?? 0
  })

  const clutchAttempts = clutches + clutchesLost
  return {
    hs:            kills > 0 ? parseFloat((headshots / kills * 100).toFixed(1)) : null,
    kda:           deaths > 0 ? parseFloat(((kills + assists) / deaths).toFixed(2)) : null,
    esr:           (fb + fd) > 0 ? parseFloat((fb / (fb + fd)).toFixed(2)) : null,
    clutches,
    clutchAttempts,
    clutchWR:      clutchAttempts > 0 ? parseFloat((clutches / clutchAttempts * 100).toFixed(1)) : null,
    aces,
  }
}

function buildOpList(ops, side) {
  return ops
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
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

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

// ── Current season transform ──────────────────────────────────────────────────

function transformCurrentSeason(rawSeasons, rawSeasonal, rawOperators) {
  const meta          = rawSeasons?.data?.metadata ?? {}
  const currentSeason = meta.currentSeason
  const level         = meta.clearanceLevel ?? null
  const segments      = rawSeasons?.data?.segments ?? []

  const currentSeg = segments.find(
    s => s.attributes?.season === currentSeason && s.attributes?.gamemode === 'pvp_ranked'
  )
  const cs = currentSeg?.stats ?? {}

  const kills   = cs.kills?.value         ?? null
  const deaths  = cs.deaths?.value        ?? null
  const wins    = cs.matchesWon?.value    ?? null
  const matches = cs.matchesPlayed?.value ?? null
  const rp      = cs.rankPoints?.value    ?? null
  const maxRp   = cs.maxRankPoints?.value ?? null
  const kd      = cs.kdRatio?.value != null
    ? parseFloat(cs.kdRatio.value.toFixed(2)) : null
  const winRate = matches > 0 ? parseFloat((wins / matches * 100).toFixed(1)) : null

  const history = rawSeasonal?.data?.history?.data ?? []
  const rank    = normalizeRank(history.at(-1)?.[1]?.metadata?.rank ?? null)

  const ops    = rawOperators?.operators ?? []
  const agg    = aggregateOps(ops)
  const ris    = computeRIS(matches, agg.kda ?? 0, agg.esr ?? 0, winRate ?? 0,
                             agg.clutchWR ?? RIS_NEUTRAL_CWR, agg.clutchAttempts, agg.hs ?? 0)

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

  return {
    stats: {
      ...(rank             != null && { rank }),
      ...(rp               != null && { rp: String(rp) }),
      ...(maxRp            != null && { maxRp: String(maxRp) }),
      ...(kd               != null && { kd: String(kd) }),
      ...(agg.kda          != null && { kda: String(agg.kda) }),
      ...(kills            != null && { kills: String(kills) }),
      ...(deaths           != null && { deaths: String(deaths) }),
      ...(winRate          != null && { winRate: winRate + '%' }),
      ...(matches          != null && { matches: String(matches) }),
      ...(agg.hs           != null && { hs: String(agg.hs) }),
      ...(agg.esr          != null && { esr: String(agg.esr) }),
      ...(agg.clutches > 0         && { clutches: String(agg.clutches) }),
      ...(agg.clutchWR     != null && { clutchWR: String(agg.clutchWR) }),
      ...(level            != null && { level: String(level) }),
      ...(agg.aces > 0             && { aces: String(agg.aces) }),
      ...(ris              != null && { ris: String(ris) }),
    },
    operators:    { atk: buildOpList(ops, 'Attacker'), def: buildOpList(ops, 'Defender') },
    careerHistory,
    updatedAt:    new Date().toISOString(),
  }
}

// ── Historical season transform ───────────────────────────────────────────────

function transformHistoricalSeason(seasonYear, rawOperators, careerEntry) {
  const ops = rawOperators?.operators ?? []

  // No operator data = player didn't play this season on ranked
  if (ops.length === 0) return { season: seasonYear, empty: true }

  const agg = aggregateOps(ops)
  const matches = careerEntry?.matches ?? 0
  const ris = computeRIS(
    matches, agg.kda ?? 0, agg.esr ?? 0,
    careerEntry?.wr ?? 0,
    agg.clutchWR ?? RIS_NEUTRAL_CWR, agg.clutchAttempts, agg.hs ?? 0
  )

  return {
    season:    seasonYear,
    // Aggregate stats pulled from careerHistory (already have them)
    kd:        careerEntry?.kd      ?? null,
    wr:        careerEntry?.wr      ?? null,
    matches:   careerEntry?.matches ?? null,
    rp:        careerEntry?.rp      ?? null,
    maxRp:     careerEntry?.maxRp   ?? null,
    kills:     careerEntry?.kills   ?? null,
    deaths:    careerEntry?.deaths  ?? null,
    // Computed from operator aggregates
    hs:        agg.hs,
    kda:       agg.kda,
    esr:       agg.esr,
    clutches:  agg.clutches,
    clutchWR:  agg.clutchWR,
    aces:      agg.aces,
    ris,
    // Full operator breakdown
    operators: { atk: buildOpList(ops, 'Attacker'), def: buildOpList(ops, 'Defender') },
    fetchedAt: new Date().toISOString(),
  }
}

// ── Backfill past seasons for one player ─────────────────────────────────────
// Capped at MAX_BACKFILL_PER_RUN seasons per player to stay under Cloudflare's
// 50 subrequest limit on the free tier. All seasons fill in over several runs.

const MAX_BACKFILL_PER_RUN = 3

async function backfillHistory(player, currentSeason, careerHistory, env) {
  const allSeasons = pastSeasons(currentSeason)   // Y6S1 → current-1

  // One KV list call instead of N individual reads — far cheaper on subrequests
  const { keys: existingKeys } = await env.R6_STATS.list({ prefix: `season:${player.tracker}:` })
  const existingSet = new Set(existingKeys.map(k => k.name))

  const missing = allSeasons.filter(s => !existingSet.has(`season:${player.tracker}:${s.str}`))
  if (missing.length === 0) return

  // Process oldest missing seasons first, capped per run
  const batch = missing.slice(0, MAX_BACKFILL_PER_RUN)
  console.log(`  ${player.name}: backfilling ${batch.length} of ${missing.length} missing seasons`)

  const results = await Promise.allSettled(
    batch.map(async s => {
      try {
        const raw         = await fetchOperatorStats(player.tracker, s.str, env.R6DATA_API_KEY)
        const careerEntry = careerHistory.find(c => c.season === s.str) ?? null
        const data        = transformHistoricalSeason(s.str, raw, careerEntry)
        await env.R6_STATS.put(`season:${player.tracker}:${s.str}`, JSON.stringify(data))
        return s.str
      } catch (err) {
        // Store an empty stub so we don't retry a season the API can't serve
        await env.R6_STATS.put(
          `season:${player.tracker}:${s.str}`,
          JSON.stringify({ season: s.str, empty: true })
        )
        throw err
      }
    })
  )

  const stored  = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  const errored = results.filter(r => r.status === 'rejected').length
  console.log(`  ${player.name}: stored ${stored.length}${errored ? `, ${errored} stubbed (no API data)` : ''}`)
}

// ── Worker entry ──────────────────────────────────────────────────────────────

export default {
  async scheduled(_event, env) {
    console.log('Stats update started:', new Date().toISOString())
    const failed = []

    for (const player of PLAYERS) {
      try {
        // 1. Fetch seasons stats first — gives us currentSeason + careerHistory
        const rawSeasons    = await fetchSeasonsStats(player.tracker, env.R6DATA_API_KEY)
        const currentSeason = rawSeasons?.data?.metadata?.currentSeason
        if (!currentSeason) throw new Error('could not detect current season')

        const seasonYear = seasonNumToStr(currentSeason)

        // 2. Fetch current season details in parallel
        const [rawSeasonal, rawOperators] = await Promise.all([
          fetchSeasonalStats(player.tracker, env.R6DATA_API_KEY),
          fetchOperatorStats(player.tracker, seasonYear, env.R6DATA_API_KEY),
        ])

        // 3. Store current season
        const data = transformCurrentSeason(rawSeasons, rawSeasonal, rawOperators)
        await env.R6_STATS.put(`player:${player.tracker}`, JSON.stringify(data))
        console.log(
          `✓ ${player.name} — ${data.stats.rank ?? 'unranked'} | ` +
          `KD ${data.stats.kd} | WR ${data.stats.winRate} | ` +
          `KDA ${data.stats.kda} | ESR ${data.stats.esr} | ` +
          `RIS ${data.stats.ris ?? '—'}`
        )

        // 4. Backfill any missing past seasons (no-op once all are cached)
        await backfillHistory(player, currentSeason, data.careerHistory, env)

      } catch (err) {
        console.error(`✗ ${player.name} failed:`, err.message)
        failed.push(player.name)
      }
    }

    if (failed.length) console.error('Failed:', failed.join(', '))
    console.log('Stats update complete:', new Date().toISOString())
  },
}
