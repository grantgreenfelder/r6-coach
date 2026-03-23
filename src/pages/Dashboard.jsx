import { Link } from 'react-router-dom'
import playersData from '../data/players.json'
import mapsData from '../data/maps.json'
import stackData from '../data/stack.json'
import metaData from '../data/meta.json'
import RatingBadge from '../components/RatingBadge.jsx'
import MarkdownContent from '../components/MarkdownContent.jsx'

function StatCard({ label, value, sub }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-siege-accent">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const mainStack = playersData.mainStack
  const strongMaps = mapsData.filter(m => m.rating === 'strong')
  const avoidMaps = mapsData.filter(m => m.rating === 'avoid')
  const developedStrats = mapsData.reduce((a, m) => a + m.stratCount.developed, 0)

  const parsedDate = new Date(metaData.parsedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-siege-muted text-sm mt-1">KB snapshot · {parsedDate}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Main Stack Players" value={mainStack.length} />
        <StatCard label="Maps Tracked" value={metaData.mapCount} />
        <StatCard label="Strats Developed" value={`${developedStrats}/${metaData.stratCount}`} />
        <StatCard label="Strong Maps" value={strongMaps.length} sub={`${avoidMaps.length} to avoid`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Main Stack</h2>
            <Link to="/players" className="text-xs text-siege-accent hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {mainStack.map(player => (
              <Link
                key={player.name}
                to={`/players/${player.name}`}
                className="flex items-center justify-between py-2 px-3 rounded hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-sm">
                    {player.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium group-hover:text-siege-accent transition-colors">{player.name}</div>
                    <div className="text-gray-500 text-xs">{player.role || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <div className="text-white text-sm font-medium">{player.stats.kd}</div>
                    <div className="text-gray-500 text-xs">K/D</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-white text-sm font-medium">{player.stats.winRate}</div>
                    <div className="text-gray-500 text-xs">WR</div>
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{player.stats.rank}</div>
                    <div className="text-gray-500 text-xs">Rank</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Map summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Map Pool</h2>
            <Link to="/maps" className="text-xs text-siege-accent hover:underline">All maps →</Link>
          </div>
          <div className="space-y-2">
            {mapsData.slice(0, 10).map(map => (
              <Link
                key={map.name}
                to={`/maps/${map.name}`}
                className="flex items-center justify-between py-1.5 hover:bg-white/5 px-2 rounded transition-colors"
              >
                <span className="text-gray-300 text-sm">{map.displayName}</span>
                <RatingBadge rating={map.rating} />
              </Link>
            ))}
            {mapsData.length > 10 && (
              <Link to="/maps" className="block text-center text-xs text-siege-muted hover:text-siege-accent pt-1">
                +{mapsData.length - 10} more maps
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Team coaching priorities */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-3">Team Coaching Priorities</h2>
        <MarkdownContent content={stackData.coachingItems} />
      </div>
    </div>
  )
}
