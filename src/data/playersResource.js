import playersUrl from './players.json?url'

const staticPromise = fetch(playersUrl).then(r => r.json())

const livePromise = fetch('/api/stats').then(r => r.json()).catch(() => null)

// Normalize operator names across sources: strips diacritics, spaces, underscores,
// hyphens and punctuation so "Solid_Snake", "Solid Snake", "Capitão", "Jäger ",
// "Nøkk" all collapse to a stable key.
export function normalizeOp(name) {
  return (name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ø/g, 'o').replace(/ð/g, 'd')
    .replace(/[^a-z0-9]/g, '')
}

function mergePlayer(player, live) {
  if (!live) return player
  const liveData = live[player.tracker]
  if (!liveData) return player

  const mergedStats = { ...player.stats }
  for (const [k, v] of Object.entries(liveData.stats)) {
    if (v !== null) mergedStats[k] = v
  }

  const hasLiveOps =
    liveData.operators?.atk?.length > 0 || liveData.operators?.def?.length > 0
  const mergedOperators = hasLiveOps ? liveData.operators : player.operators

  // Derive primary ops from live data for display on cards
  const _topAtkOps = mergedOperators?.atk?.slice(0, 2).map(o => o.name) ?? []
  const _topDefOps = mergedOperators?.def?.slice(0, 2).map(o => o.name) ?? []

  return {
    ...player,
    stats: mergedStats,
    operators: mergedOperators,
    careerHistory: liveData.careerHistory ?? player.careerHistory ?? [],
    _topAtkOps,
    _topDefOps,
    _updatedAt: liveData.updatedAt ?? null,
  }
}

// Invert player→operators into operator→players for the current season, built
// entirely from live data. Keyed by normalized operator name.
//   { [normName]: { side: 'ATK'|'DEF', rows: [{ player, rounds, winRate, kd, hs,
//                    clutches, clutchWR, firstBloods, firstDeaths, assists, isMain }] } }
function buildOperatorStats(players) {
  const map = {}
  for (const p of players) {
    const topSet = new Set([...(p._topAtkOps || []), ...(p._topDefOps || [])].map(normalizeOp))
    for (const side of ['atk', 'def']) {
      for (const op of (p.operators?.[side] || [])) {
        const key = normalizeOp(op.name)
        if (!map[key]) map[key] = { side: side.toUpperCase(), rows: [] }
        map[key].rows.push({
          player:      p.name,
          rounds:      op.rounds,
          winRate:     op.winRate,
          kd:          op.kd,
          hs:          op.hs ?? null,
          clutches:    op.clutches ?? 0,
          clutchWR:    op.clutchWR ?? 0,
          firstBloods: op.firstBloods ?? 0,
          firstDeaths: op.firstDeaths ?? 0,
          assists:     op.assists ?? 0,
          isMain:      topSet.has(key),
        })
      }
    }
  }
  return map
}

export const playersPromise = Promise.all([staticPromise, livePromise]).then(
  ([data, live]) => {
    const merge = p => mergePlayer(p, live)
    const mainStack = data.mainStack.map(merge)
    const bTeam     = (data.bTeam  || []).map(merge)

    // Surface the most recent updatedAt across all players for headers
    const allUpdatedAt = [...mainStack, ...bTeam]
      .map(p => p._updatedAt)
      .filter(Boolean)
      .sort()
    const _updatedAt = allUpdatedAt.at(-1) ?? null

    // Live operator stats are built from the main stack + B team (the players we track)
    const _operatorStats = buildOperatorStats([...mainStack, ...bTeam])

    return { ...data, mainStack, bTeam, _updatedAt, _operatorStats }
  }
)
