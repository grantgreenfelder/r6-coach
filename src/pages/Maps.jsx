import { Link } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'

const RATING_ORDER = ['strong', 'moderate', 'weak', 'avoid', 'unknown']

export default function Maps() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = mapsData
    .filter(m => filter === 'all' || m.rating === filter)
    .filter(m => m.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => RATING_ORDER.indexOf(a.rating) - RATING_ORDER.indexOf(b.rating))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Maps</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search maps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-siege-card border border-siege-border rounded px-3 py-1.5 text-sm text-white placeholder-siege-muted focus:outline-none focus:border-siege-accent"
          />
          {['all', 'strong', 'moderate', 'weak', 'avoid'].map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 text-sm rounded capitalize border transition-colors ${
                filter === r
                  ? 'bg-siege-accent border-siege-accent text-siege-bg font-semibold'
                  : 'border-siege-border text-siege-muted hover:text-white hover:border-siege-muted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(map => (
          <MapCard key={map.name} map={map} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-siege-muted text-center py-12">No maps match this filter.</p>
      )}
    </div>
  )
}

function MapCard({ map }) {
  const atkStrats = map.strats.filter(s => s.side === 'ATK')
  const defStrats = map.strats.filter(s => s.side === 'DEF')

  const devCount = map.stratCount.developed
  const partialCount = map.stratCount.partial
  const totalCount = map.stratCount.total

  return (
    <Link
      to={`/maps/${map.name}`}
      className="card hover:border-siege-accent transition-colors block group"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-white font-semibold text-lg group-hover:text-siege-accent transition-colors">
          {map.displayName}
        </h2>
        <RatingBadge rating={map.rating} label={map.ratingLabel} />
      </div>

      {/* Win rate bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          {map.teamWinRate !== null ? (
            <>
              <span className={
                map.teamWinRate >= 50 ? 'text-siege-green font-semibold' :
                map.teamWinRate >= 40 ? 'text-yellow-400 font-semibold' :
                'text-siege-red font-semibold'
              }>{map.teamWinRate}% Win Rate</span>
              <span className="text-siege-muted">{map.teamWinRateMatches}M sample</span>
            </>
          ) : (
            <span className="text-siege-muted">No match data</span>
          )}
        </div>
        <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              map.teamWinRate === null ? '' :
              map.teamWinRate >= 50 ? 'bg-siege-green' :
              map.teamWinRate >= 40 ? 'bg-yellow-500' :
              'bg-siege-red'
            }`}
            style={{ width: map.teamWinRate !== null ? `${Math.min(map.teamWinRate, 100)}%` : '0%' }}
          />
        </div>
        <div className="text-xs text-siege-muted mt-1">
          {devCount} strats ready · {partialCount} partial · {totalCount - devCount - partialCount} not started
        </div>
      </div>

      {/* Attack / Defense split */}
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-siege-muted">Attack </span>
          <span className="text-white font-medium">{atkStrats.length}</span>
          <span className="text-siege-muted"> sites</span>
        </div>
        <div>
          <span className="text-siege-muted">Defense </span>
          <span className="text-white font-medium">{defStrats.length}</span>
          <span className="text-siege-muted"> sites</span>
        </div>
      </div>

      {/* Quick strat status dots */}
      {map.strats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {map.strats.map(s => (
            <StatusDot key={s.filename} status={s.status} title={`${s.side} ${s.site}`} />
          ))}
        </div>
      )}
    </Link>
  )
}
