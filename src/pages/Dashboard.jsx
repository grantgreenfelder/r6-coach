import { Link } from 'react-router-dom'
import playersData from '../data/players.json'
import mapsData from '../data/maps.json'
import stackData from '../data/stack.json'
import metaData from '../data/meta.json'

// ─── Insight Strip ─────────────────────────────────────────────────────────────

function InsightCard({ label, value, sub, color = 'text-siege-accent', to }) {
  const inner = (
    <div className="card flex-1 min-w-0">
      <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold truncate ${color}`}>{value}</p>
      {sub && <p className="text-siege-muted text-xs mt-0.5 truncate">{sub}</p>}
    </div>
  )
  return to ? <Link to={to} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">{inner}</Link> : inner
}

// ─── Player Card ───────────────────────────────────────────────────────────────

function PlayerCard({ player }) {
  const { kd, ris, winRate, rank } = player.stats
  const wrNum = parseFloat(winRate) || 0

  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent transition-colors group"
    >
      {/* Name + rank */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-sm flex-shrink-0">
            {player.name[0]}
          </div>
          <span className="text-white font-semibold group-hover:text-siege-accent transition-colors">{player.name}</span>
        </div>
        <span className="text-siege-muted text-xs">{rank}</span>
      </div>

      {/* Big stat numbers */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-white text-lg font-bold leading-none">{kd ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5">K/D</p>
        </div>
        <div className="text-center">
          <p className="text-siege-accent text-lg font-bold leading-none">{ris ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5">RIS</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${
            wrNum >= 55 ? 'text-siege-green' :
            wrNum >= 45 ? 'text-white' :
            wrNum >= 35 ? 'text-yellow-400' : 'text-siege-red'
          }`}>{winRate ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5">Win%</p>
        </div>
      </div>

      {/* Win% bar */}
      <div className="h-1 bg-siege-border rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${
            wrNum >= 55 ? 'bg-siege-green' :
            wrNum >= 45 ? 'bg-blue-400' :
            wrNum >= 35 ? 'bg-yellow-500' : 'bg-siege-red'
          }`}
          style={{ width: wrNum > 0 ? `${Math.min(wrNum, 100)}%` : '0%' }}
        />
      </div>

      {/* Ops */}
      {(player.atkOps || player.defOps) && (
        <div className="flex gap-3 text-xs text-siege-muted">
          {player.atkOps && <span><span className="text-gray-500">Atk </span>{player.atkOps}</span>}
          {player.defOps && <span><span className="text-gray-500">Def </span>{player.defOps}</span>}
        </div>
      )}
    </Link>
  )
}

// ─── Map Heatmap ───────────────────────────────────────────────────────────────

function MapTile({ map }) {
  const wr = map.teamWinRate
  const bg =
    wr === null ? 'bg-siege-card border-siege-border text-siege-muted' :
    wr >= 55 ? 'bg-siege-green/20 border-siege-green/50 text-siege-green' :
    wr >= 45 ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' :
    wr >= 35 ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400' :
    'bg-siege-red/15 border-siege-red/40 text-siege-red'

  return (
    <Link
      to={`/maps/${map.name}`}
      className={`border rounded-lg px-2 py-2 text-center hover:opacity-80 transition-opacity ${bg}`}
    >
      <p className="text-xs font-medium leading-tight truncate">{map.displayName}</p>
      <p className="text-sm font-bold mt-0.5">{wr !== null ? `${wr}%` : '—'}</p>
    </Link>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const mainStack = playersData.mainStack || []
  const rankedMaps = mapsData.filter(m => m.inRankedPool)
  const teamFocusItems = stackData.teamFocusItems || []

  // Best / ban target maps
  const rankedWithWR = rankedMaps.filter(m => m.teamWinRate !== null)
  const bestMap = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : null
  const banTarget = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate < b.teamWinRate ? a : b)
    : null

  // Team avg Win%
  const wrValues = mainStack.map(p => parseFloat(p.stats?.winRate)).filter(n => !isNaN(n))
  const avgWR = wrValues.length > 0
    ? (wrValues.reduce((a, b) => a + b, 0) / wrValues.length).toFixed(1) + '%'
    : '—'
  const topWR = wrValues.length > 0
    ? mainStack.reduce((best, p) => {
        const v = parseFloat(p.stats?.winRate)
        return !isNaN(v) && (best === null || v > parseFloat(best.stats?.winRate)) ? p : best
      }, null)
    : null

  // Spotlight — auto-pick: highest RIS player as MVP, positive team DEF note
  const risPlayers = mainStack.filter(p => p.stats?.ris && p.stats.ris !== '—')
  const mvp = risPlayers.length > 0
    ? risPlayers.reduce((a, b) => parseFloat(a.stats.ris) > parseFloat(b.stats.ris) ? a : b)
    : null

  // Top map by win% with enough data (best confidence map)
  const confidentMaps = rankedWithWR.filter(m => m.teamWinRateMatches >= 20)
  const spotlightMap = confidentMaps.length > 0
    ? confidentMaps.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : bestMap

  // Count how many main stack players are above 50% WR
  const positiveWRCount = mainStack.filter(p => parseFloat(p.stats?.winRate) >= 50).length

  const parsedDate = new Date(metaData.parsedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-siege-muted text-xs mt-0.5">KB snapshot · {parsedDate}</p>
        </div>
        <Link
          to="/session-prep"
          className="px-4 py-2 rounded bg-siege-accent text-siege-bg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Session Prep →
        </Link>
      </div>

      {/* Insight strip */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <InsightCard
          label="Best Map Right Now"
          value={bestMap ? bestMap.displayName : '—'}
          sub={bestMap ? `${bestMap.teamWinRate}% win rate` : 'no data'}
          color="text-siege-green"
          to={bestMap ? `/maps/${bestMap.name}` : undefined}
        />
        <InsightCard
          label="Ban Target"
          value={banTarget ? banTarget.displayName : '—'}
          sub={banTarget ? `${banTarget.teamWinRate}% win rate` : 'no data'}
          color="text-siege-red"
          to={banTarget ? `/maps/${banTarget.name}` : undefined}
        />
        <InsightCard
          label="Team Avg Win%"
          value={avgWR}
          sub={topWR ? `Best: ${topWR.name} @ ${topWR.stats?.winRate}` : undefined}
          color="text-siege-accent"
        />
      </div>

      {/* Player cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Main Stack</h2>
          <Link to="/players" className="text-xs text-siege-accent hover:underline">All players →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {mainStack.map(player => (
            <PlayerCard key={player.name} player={player} />
          ))}
        </div>
      </div>

      {/* Map heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
            Ranked Pool — Win% Heatmap
          </h2>
          <div className="flex items-center gap-3 text-xs text-siege-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-siege-green inline-block" />≥55%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />45–55%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />35–45%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-siege-red inline-block" />&lt;35%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {rankedMaps.map(map => (
            <MapTile key={map.name} map={map} />
          ))}
        </div>
        <Link to="/maps" className="block text-xs text-siege-muted hover:text-siege-accent mt-2 text-right transition-colors">
          View all maps →
        </Link>
      </div>

      {/* Bottom row: Spotlight + Team Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Spotlight */}
        <div className="card">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">⭐ Spotlight</h2>
          <div className="space-y-3">

            {/* MVP player */}
            {mvp && (
              <Link to={`/players/${mvp.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-green/10 border border-siege-green/30 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-siege-green/20 flex items-center justify-center text-siege-green font-bold flex-shrink-0">
                  {mvp.name[0]}
                </div>
                <div>
                  <p className="text-siege-green font-semibold text-sm">{mvp.name} — Season Leader</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    RIS {mvp.stats.ris} · K/D {mvp.stats.kd} · {mvp.stats.winRate} Win%
                  </p>
                </div>
              </Link>
            )}

            {/* Top map */}
            {spotlightMap && (
              <Link to={`/maps/${spotlightMap.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-accent/10 border border-siege-accent/20 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-lg flex-shrink-0">
                  🗺
                </div>
                <div>
                  <p className="text-siege-accent font-semibold text-sm">{spotlightMap.displayName} — Confidence Map</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {spotlightMap.teamWinRate}% team win rate · {spotlightMap.teamWinRateMatches} matches tracked
                  </p>
                </div>
              </Link>
            )}

            {/* Positive team note */}
            {positiveWRCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-lg flex-shrink-0">
                  🛡
                </div>
                <div>
                  <p className="text-blue-300 font-semibold text-sm">Defense is the Stack's Identity</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {positiveWRCount} of {mainStack.length} players above 50% win rate — anchor up.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Focus of the Week */}
        {teamFocusItems.length > 0 && (
          <div className="card">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Team Focus</h2>
            <div className="space-y-3">
              {teamFocusItems.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-siege-accent font-bold text-sm flex-shrink-0 w-5">{i + 1}.</span>
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                    {item.body && <p className="text-siege-muted text-xs mt-0.5 leading-relaxed">{item.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
