import playersUrl from './players.json?url'

const staticPromise = fetch(playersUrl).then(r => r.json())

// Fetch live stats from the Pages Function. Falls back to static data silently
// if the Worker hasn't run yet or the API is unavailable.
const livePromise = fetch('/api/stats').then(r => r.json()).catch(() => null)

function mergePlayer(player, live) {
  if (!live) return player
  const liveData = live[player.tracker]
  if (!liveData) return player

  // Only overwrite stat fields that the API actually returned (non-null).
  // Preserves manual-only fields: ris, esr, kda, clutches, clutchWR.
  const mergedStats = { ...player.stats }
  for (const [k, v] of Object.entries(liveData.stats)) {
    if (v !== null) mergedStats[k] = v
  }

  // Only overwrite operators if the API returned a non-empty breakdown.
  const hasLiveOps =
    liveData.operators?.atk?.length > 0 || liveData.operators?.def?.length > 0
  const mergedOperators = hasLiveOps ? liveData.operators : player.operators

  return { ...player, stats: mergedStats, operators: mergedOperators }
}

export const playersPromise = Promise.all([staticPromise, livePromise]).then(
  ([data, live]) => ({
    ...data,
    mainStack: data.mainStack.map(p => mergePlayer(p, live)),
    ...(data.bTeam ? { bTeam: data.bTeam.map(p => mergePlayer(p, live)) } : {}),
  })
)
