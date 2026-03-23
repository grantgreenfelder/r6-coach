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
  const allPlayers = [...(playersData.mainStack || []), ...(playersData.bTeam || [])]
  const mainStack = playersData.mainStack || []
  const rankedMaps = mapsData.filter(m => m.inRankedPool)

  // Best map: highest win% in ranked pool
  const rankedWithWR = rankedMaps.filter(m => m.teamWinRate !== null)
  const bestMap = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : null
  const banTarget = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate < b.teamWinRate ? a : b)
    : null

  // Team avg K/D
  const kdValues = mainStack.map(p => parseFloat(p.stats?.kd)).filter(n => !isNaN(n))
  const avgKD = kdValues.length > 0 ? (kdValues.reduce((a, b) => a + b, 0) / kdValues.length).toFixed(2) : '—'
  const topKD = kdValues.length > 0
    ? mainStack.reduce((best, p) => {
        const v = parseFloat(p.stats?.kd)
        return !isNaN(v) && (best === null || v > parseFloat(best.stats?.kd)) ? p : best
      }, null)
    : null

  const coachingItems = stackData.coachingItemsStructured || []

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
          to="/session"
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
          label="Team Avg K/D"
          value={avgKD}
          sub={topKD ? `Top: ${topKD.name} @ ${topKD.stats?.kd}` : undefined}
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

      {/* Coaching priorities */}
      {coachingItems.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Active Coaching Focus</h2>
          <div className="flex flex-wrap gap-2">
            {coachingItems.map((item, i) => (
              <div
                key={i}
                className={`inline-flex items-start gap-2 rounded-lg px-3 py-2 text-sm border max-w-sm ${
                  item.playerTag
                    ? 'bg-siege-blue/10 border-siege-blue/30'
                    : 'bg-siege-accent/10 border-siege-accent/20'
                }`}
              >
                <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${
                  item.playerTag ? 'text-siege-blue' : 'text-siege-accent'
                }`}>
                  {item.playerTag ?? 'Team'}
                </span>
                <span className="text-gray-300 leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
