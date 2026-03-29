import { Link } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'
import { getMapThumbnailUrl } from '../utils/mapThumbnails'

const SEASONS = ['Y11S1', 'Y10S4']

// Derive rating for a given win rate (used when viewing Y10S4 to show contextual badge)
function ratingFromWr(wr) {
  if (wr === null) return 'unknown'
  if (wr >= 60) return 'strong'
  if (wr >= 50) return 'even'
  if (wr >= 40) return 'shaky'
  if (wr >= 30) return 'avoid'
  return 'ban'
}

export default function Maps() {
  const [season, setSeason]   = useState('Y11S1')
  const [search, setSearch]   = useState('')
  const [sortBy, setSortBy]   = useState('winrate') // 'name' | 'winrate'

  // Pick the right win rate field based on selected season
  const getWr      = m => season === 'Y11S1' ? m.teamWinRate         : m.teamWinRateY10S4
  const getWrM     = m => season === 'Y11S1' ? m.teamWinRateMatches  : m.teamWinRateMatchesY10S4
  const getRating  = m => season === 'Y11S1' ? m.rating              : ratingFromWr(m.teamWinRateY10S4)

  const applyFilters = (maps) => maps
    .filter(m => m.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'winrate') {
        const wa = getWr(a), wb = getWr(b)
        if (wa === null && wb === null) return 0
        if (wa === null) return 1
        if (wb === null) return -1
        return wb - wa
      }
      return a.displayName.localeCompare(b.displayName)
    })

  const tracked   = applyFilters(mapsData.filter(m => getWr(m) !== null))
  const untracked = applyFilters(mapsData.filter(m => getWr(m) === null))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header + controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Maps</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search maps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-siege-card border border-siege-border rounded px-3 py-1.5 text-sm text-white placeholder-siege-muted focus:outline-none focus:border-siege-accent"
          />

          {/* Sort toggle */}
          <div className="flex rounded border border-siege-border overflow-hidden">
            {[{ value: 'winrate', label: 'Win%' }, { value: 'name', label: 'A–Z' }].map(s => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortBy === s.value
                    ? 'bg-siege-accent text-siege-bg font-semibold'
                    : 'text-siege-muted hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Season selector */}
          <div className="flex rounded border border-siege-border overflow-hidden">
            {SEASONS.map(s => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  season === s
                    ? 'bg-siege-accent text-siege-bg font-semibold'
                    : 'text-siege-muted hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tracked */}
      {tracked.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Tracked</h2>
            <div className="flex-1 h-px bg-siege-border" />
            <span className="text-siege-muted text-xs">{tracked.length} maps · {season}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracked.map(map => <MapCard key={map.name} map={map} season={season} getWr={getWr} getWrM={getWrM} getRating={getRating} />)}
          </div>
        </div>
      )}

      {/* Untracked */}
      {untracked.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-siege-muted font-semibold text-sm uppercase tracking-wider">Untracked</h2>
            <div className="flex-1 h-px bg-siege-border/40" />
            <span className="text-siege-muted text-xs">{untracked.length} maps · {season}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            {untracked.map(map => <MapCard key={map.name} map={map} season={season} getWr={getWr} getWrM={getWrM} getRating={getRating} />)}
          </div>
        </div>
      )}

      {tracked.length === 0 && untracked.length === 0 && (
        <p className="text-siege-muted text-center py-12">No maps found.</p>
      )}
    </div>
  )
}

function MapCard({ map, season, getWr, getWrM, getRating }) {
  const wr      = getWr(map)
  const wrM     = getWrM(map)
  const rating  = getRating(map)

  const devCount     = map.stratCount.developed
  const partialCount = map.stratCount.partial
  const totalCount   = map.stratCount.total

  const barColor =
    wr === null  ? '' :
    wr >= 60     ? 'bg-siege-green' :
    wr >= 50     ? 'bg-blue-500' :
    wr >= 40     ? 'bg-yellow-500' :
    wr >= 30     ? 'bg-orange-500' :
                   'bg-red-600'

  const wrTextColor =
    wr === null  ? 'text-siege-muted' :
    wr >= 60     ? 'text-siege-green font-semibold' :
    wr >= 50     ? 'text-blue-400 font-semibold' :
    wr >= 40     ? 'text-yellow-400 font-semibold' :
    wr >= 30     ? 'text-orange-400 font-semibold' :
                   'text-red-400 font-semibold'

  const thumbnailUrl = getMapThumbnailUrl(map.name)

  return (
    <Link
      to={`/maps/${map.name}`}
      className="card hover:border-siege-accent transition-colors block group overflow-hidden p-0"
    >
      {/* Image strip header */}
      <div className="relative h-20 overflow-hidden bg-siege-border">
        {thumbnailUrl && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-siege-card/90 to-black/10" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-end justify-between gap-2">
          <h2 className="text-white font-semibold text-base group-hover:text-siege-accent transition-colors leading-tight drop-shadow">
            {map.displayName}
          </h2>
          <RatingBadge rating={rating} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Win rate bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            {wr !== null ? (
              <>
                <span className={wrTextColor}>
                  {wr}% Win Rate
                  <span className="text-siege-muted font-normal ml-1">· {season}</span>
                </span>
                <span className="text-siege-muted">{wrM}M sample</span>
              </>
            ) : (
              <span className="text-siege-muted">No {season} data</span>
            )}
          </div>
          <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: wr !== null ? `${Math.min(wr, 100)}%` : '0%' }}
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
            <span className="text-white font-medium">{map.strats.filter(s => s.side === 'ATK').length}</span>
            <span className="text-siege-muted"> sites</span>
          </div>
          <div>
            <span className="text-siege-muted">Defense </span>
            <span className="text-white font-medium">{map.strats.filter(s => s.side === 'DEF').length}</span>
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
      </div>
    </Link>
  )
}
