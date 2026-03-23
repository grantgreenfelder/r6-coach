import { Link } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'

const RATING_ORDER = ['strong', 'moderate', 'weak', 'avoid', 'unknown']

// rankedPool values:
//   'both'   = active all season (First + Second Half)
//   'first'  = active now, LEAVING at mid-season split
//   'second' = NOT active now, returning at mid-season split
//   null     = not in ranked pool this season
export const POOL_LABEL = {
  both:   { text: 'Full Season',            color: 'text-siege-green',  icon: '✓' },
  first:  { text: 'Leaving at mid-season',  color: 'text-yellow-400',   icon: '⚠' },
  second: { text: 'Returns at mid-season',  color: 'text-siege-blue',   icon: '↩' },
}

export default function Maps() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const applyFilters = (maps) => maps
    .filter(m => filter === 'all' || m.rating === filter)
    .filter(m => m.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => RATING_ORDER.indexOf(a.rating) - RATING_ORDER.indexOf(b.rating))

  const ranked = applyFilters(mapsData.filter(m => m.inRankedPool))
  // Split unranked: returning mid-season vs fully out of pool
  const returningMaps = applyFilters(mapsData.filter(m => !m.inRankedPool && m.rankedPool === 'second'))
  const unrankedMaps  = applyFilters(mapsData.filter(m => !m.inRankedPool && m.rankedPool !== 'second'))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header + filters */}
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

      {/* Ranked Pool */}
      {ranked.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Y11S1 Ranked Pool</h2>
            <div className="flex-1 h-px bg-siege-border" />
            <span className="text-siege-muted text-xs">{ranked.length} maps</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranked.map(map => <MapCard key={map.name} map={map} />)}
          </div>
        </div>
      )}

      {/* Returning mid-season */}
      {returningMaps.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-siege-blue font-semibold text-sm uppercase tracking-wider">↩ Returning at Mid-Season</h2>
            <div className="flex-1 h-px bg-siege-border/50" />
            <span className="text-siege-muted text-xs">{returningMaps.length} maps</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {returningMaps.map(map => <MapCard key={map.name} map={map} />)}
          </div>
        </div>
      )}

      {/* Unranked */}
      {unrankedMaps.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-siege-muted font-semibold text-sm uppercase tracking-wider">Unranked</h2>
            <div className="flex-1 h-px bg-siege-border/40" />
            <span className="text-siege-muted text-xs">{unrankedMaps.length} maps</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            {unrankedMaps.map(map => <MapCard key={map.name} map={map} />)}
          </div>
        </div>
      )}

      {ranked.length === 0 && returningMaps.length === 0 && unrankedMaps.length === 0 && (
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
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-white font-semibold text-lg group-hover:text-siege-accent transition-colors">
          {map.displayName}
        </h2>
        <RatingBadge rating={map.rating} label={map.ratingLabel} />
      </div>
      {map.rankedPool && POOL_LABEL[map.rankedPool] && (
        <p className={`text-xs mb-2 ${POOL_LABEL[map.rankedPool].color}`}>
          {POOL_LABEL[map.rankedPool].text}
        </p>
      )}

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
