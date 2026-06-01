import playersUrl from './players.json?url'

const staticPromise = fetch(playersUrl).then(r => r.json())

const livePromise = fetch('/api/stats').then(r => r.json()).catch(() => null)

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

export const playersPromise = Promise.all([staticPromise, livePromise]).then(
  ([data, live]) => {
    const merge = p => mergePlayer(p, live)
    const mainStack = data.mainStack.map(merge)
    const bTeam     = (data.bTeam  || []).map(merge)

    // Surface the most recent updatedAt across all players for the dashboard header
    const allUpdatedAt = [...mainStack, ...bTeam]
      .map(p => p._updatedAt)
      .filter(Boolean)
      .sort()
    const _updatedAt = allUpdatedAt.at(-1) ?? null

    return { ...data, mainStack, bTeam, _updatedAt }
  }
)
