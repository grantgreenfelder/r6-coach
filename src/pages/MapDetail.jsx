import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'
import MarkdownContent from '../components/MarkdownContent'

export default function MapDetail() {
  const { mapName } = useParams()
  const map = mapsData.find(m => m.name === mapName)
  const [activeTab, setActiveTab] = useState('strats')
  const [sideFilter, setSideFilter] = useState('all')

  if (!map) {
    return (
      <div className="p-8 text-center">
        <p className="text-siege-muted text-lg">Map not found: {mapName}</p>
        <Link to="/maps" className="text-siege-accent hover:underline mt-4 inline-block">← Back to Maps</Link>
      </div>
    )
  }

  const filteredStrats = map.strats.filter(s =>
    sideFilter === 'all' || s.side === sideFilter
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link to="/maps" className="text-siege-muted hover:text-siege-accent text-sm">← Maps</Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{map.displayName}</h1>
            {map.ratingLabel && map.ratingLabel !== '—' && (
              <p className="text-siege-muted text-sm mt-1">{map.ratingLabel}</p>
            )}
          </div>
          <RatingBadge rating={map.rating} label={map.ratingLabel} size="lg" />
        </div>

        {/* Strat summary */}
        <div className="mt-4 flex gap-6 text-sm">
          <Stat label="Total Sites" value={map.stratCount.total} />
          <Stat label="Developed" value={map.stratCount.developed} color="text-siege-green" />
          <Stat label="Partial" value={map.stratCount.partial} color="text-yellow-500" />
          <Stat label="Not Started" value={map.stratCount.total - map.stratCount.developed - map.stratCount.partial} color="text-siege-muted" />
        </div>

        {/* Progress bar */}
        {map.stratCount.total > 0 && (
          <div className="mt-3 h-2 bg-siege-border rounded-full overflow-hidden flex">
            <div
              className="bg-siege-green h-full transition-all"
              style={{ width: `${(map.stratCount.developed / map.stratCount.total) * 100}%` }}
            />
            <div
              className="bg-yellow-500 h-full transition-all"
              style={{ width: `${(map.stratCount.partial / map.stratCount.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-siege-border">
        {['strats', 'overview', 'reference'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {tab === 'strats' ? `Strats (${map.strats.length})` : tab}
          </button>
        ))}
      </div>

      {/* Strats tab */}
      {activeTab === 'strats' && (
        <div className="space-y-4">
          {/* Side filter */}
          <div className="flex gap-2">
            {['all', 'ATK', 'DEF'].map(s => (
              <button
                key={s}
                onClick={() => setSideFilter(s)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  sideFilter === s
                    ? 'bg-siege-accent border-siege-accent text-siege-bg font-semibold'
                    : 'border-siege-border text-siege-muted hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredStrats.map(strat => (
              <StratCard key={strat.filename} strat={strat} mapName={mapName} />
            ))}
          </div>

          {filteredStrats.length === 0 && (
            <p className="text-siege-muted text-center py-8">No strats for this filter.</p>
          )}
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="card">
          {map.overviewContent ? (
            <MarkdownContent content={map.overviewContent} />
          ) : (
            <p className="text-siege-muted">No overview file found for this map.</p>
          )}
        </div>
      )}

      {/* Reference tab */}
      {activeTab === 'reference' && (
        <div className="card">
          {map.referenceContent ? (
            <MarkdownContent content={map.referenceContent} />
          ) : (
            <p className="text-siege-muted">No reference file found for this map.</p>
          )}
        </div>
      )}
    </div>
  )
}

function StratCard({ strat, mapName }) {
  const sideColor = strat.side === 'ATK' ? 'text-siege-accent' : 'text-siege-blue'
  const encodedSide = strat.side.toLowerCase()
  const encodedSite = encodeURIComponent(strat.site)

  return (
    <Link
      to={`/maps/${mapName}/${encodedSide}/${encodedSite}`}
      className="card hover:border-siege-accent transition-colors block group"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${sideColor}`}>{strat.side}</span>
            <StatusDot status={strat.status} />
          </div>
          <h3 className="text-white font-medium group-hover:text-siege-accent transition-colors">
            {strat.site}
          </h3>
        </div>
        <span className="text-siege-muted text-xs">View →</span>
      </div>

      {/* Role count */}
      {strat.roles.length > 0 && (
        <p className="text-siege-muted text-xs mt-2">{strat.roles.length} roles defined</p>
      )}
    </Link>
  )
}

function Stat({ label, value, color = 'text-white' }) {
  return (
    <div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-siege-muted text-xs">{label}</div>
    </div>
  )
}
