import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'
import { NotFound } from '../components/EmptyState'
import MarkdownContent from '../components/MarkdownContent'
import { wrColor, wrBgColor, kdColor } from '../utils/constants'

export default function MapDetail() {
  const { mapName } = useParams()
  const map = mapsData.find(m => m.name === mapName)
  const [activeTab, setActiveTab] = useState('strats')
  const [sideFilter, setSideFilter] = useState('all')

  // Stats tab — derive available seasons and default to the most recent
  const availableSeasons = map
    ? Object.keys(map.playerStats || {}).sort().reverse()   // Y11S1 before Y10S4
    : []
  const [activeSeason, setActiveSeason] = useState(() => availableSeasons[0] || '')

  if (!map) {
    return <NotFound icon="🗺" title="Map not found" message={`"${mapName}" isn't in the map pool.`} backTo="/maps" backLabel="Back to Maps" />
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

        {/* Pool status banner */}
        {map.inRankedPool && map.rankedPool === 'first' && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <span>⚠</span>
            <span>In ranked pool now — <strong>leaving at the Y11S1 mid-season split</strong>. Strat this map before it rotates out.</span>
          </div>
        )}
        {map.inRankedPool && map.rankedPool === 'both' && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-siege-green/10 border border-siege-green/30 text-siege-green text-sm">
            <span>✓</span>
            <span>In ranked pool for the <strong>full Y11S1 season</strong>.</span>
          </div>
        )}
        {!map.inRankedPool && map.rankedPool === 'second' && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-siege-blue/10 border border-siege-blue/30 text-blue-300 text-sm">
            <span>↩</span>
            <span>Not in the current pool — <strong>returns at the Y11S1 mid-season split</strong>. Good time to build strats now.</span>
          </div>
        )}
        {!map.inRankedPool && !map.rankedPool && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-siege-border/30 border border-siege-border text-siege-muted text-sm">
            <span>—</span>
            <span>Not in the Y11S1 ranked pool.</span>
          </div>
        )}

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
        {['strats', 'stats', 'overview', 'reference'].map(tab => (
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
            {[
              { value: 'all', label: 'All' },
              { value: 'ATK', label: 'Attack' },
              { value: 'DEF', label: 'Defense' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSideFilter(value)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  sideFilter === value
                    ? 'bg-siege-accent border-siege-accent text-siege-bg font-semibold'
                    : 'border-siege-border text-siege-muted hover:text-white'
                }`}
              >
                {label}
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

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {availableSeasons.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-siege-muted">No player map data available yet.</p>
              <p className="text-siege-muted text-sm mt-1">Data appears after the first stat pull with 5+ matches on this map.</p>
            </div>
          ) : (
            <>
              {/* Season selector */}
              <div className="flex gap-2">
                {availableSeasons.map(season => (
                  <button
                    key={season}
                    onClick={() => setActiveSeason(season)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      activeSeason === season
                        ? 'bg-siege-accent border-siege-accent text-siege-bg font-semibold'
                        : 'border-siege-border text-siege-muted hover:text-white'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>

              {/* Stats table */}
              <MapStatsTable
                rows={map.playerStats[activeSeason] || []}
                season={activeSeason}
              />
            </>
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
            <span className={`text-xs font-bold ${sideColor}`}>{strat.side === 'ATK' ? 'Attack' : 'Defense'}</span>
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

function MapStatsTable({ rows, season }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-siege-muted">No player data for {season} on this map.</p>
        <p className="text-siege-muted text-sm mt-1">Players appear here once they have 5+ ranked matches on this map.</p>
      </div>
    )
  }

  // Compute match-weighted team averages
  const totalMatches = rows.reduce((s, r) => s + r.matches, 0)
  const avg = {
    matches: totalMatches,
    winRate: totalMatches > 0
      ? Math.round((rows.reduce((s, r) => s + r.winRate * r.matches, 0) / totalMatches) * 10) / 10
      : null,
    kd: totalMatches > 0
      ? Math.round((rows.reduce((s, r) => s + r.kd * r.matches, 0) / totalMatches) * 100) / 100
      : null,
    atkWr: totalMatches > 0
      ? Math.round((rows.reduce((s, r) => s + r.atkWr * r.matches, 0) / totalMatches) * 10) / 10
      : null,
    defWr: totalMatches > 0
      ? Math.round((rows.reduce((s, r) => s + r.defWr * r.matches, 0) / totalMatches) * 10) / 10
      : null,
  }

  const colHead = 'text-left text-xs text-siege-muted font-medium uppercase tracking-wide py-2 px-3'
  const cell = 'py-2 px-3 text-sm'

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-siege-border">
            <th className={colHead}>Player</th>
            <th className={`${colHead} text-right`}>Matches</th>
            <th className={`${colHead} text-right`}>Win%</th>
            <th className={`${colHead} text-right`}>K/D</th>
            <th className={`${colHead} text-right`}>Atk%</th>
            <th className={`${colHead} text-right`}>Def%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.callsign}
              className={`border-b border-siege-border/50 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
            >
              <td className={`${cell} font-medium text-white`}>{row.callsign}</td>
              <td className={`${cell} text-right text-siege-muted`}>{row.matches}</td>
              <td className={`${cell} text-right`}>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${wrBgColor(row.winRate)} ${wrColor(row.winRate)}`}>
                  {row.winRate}%
                </span>
              </td>
              <td className={`${cell} text-right ${kdColor(row.kd)}`}>{row.kd.toFixed(2)}</td>
              <td className={`${cell} text-right ${wrColor(row.atkWr)}`}>{row.atkWr}%</td>
              <td className={`${cell} text-right ${wrColor(row.defWr)}`}>{row.defWr}%</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 1 && (
          <tfoot>
            <tr className="border-t-2 border-siege-border bg-white/[0.03]">
              <td className={`${cell} font-semibold text-siege-muted uppercase text-xs tracking-wide`}>Team Avg</td>
              <td className={`${cell} text-right text-siege-muted text-xs`}>{avg.matches}M total</td>
              <td className={`${cell} text-right`}>
                {avg.winRate !== null && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${wrBgColor(avg.winRate)} ${wrColor(avg.winRate)}`}>
                    {avg.winRate}%
                  </span>
                )}
              </td>
              <td className={`${cell} text-right ${avg.kd !== null ? kdColor(avg.kd) : 'text-siege-muted'}`}>
                {avg.kd !== null ? avg.kd.toFixed(2) : '—'}
              </td>
              <td className={`${cell} text-right ${avg.atkWr !== null ? wrColor(avg.atkWr) : 'text-siege-muted'}`}>
                {avg.atkWr !== null ? `${avg.atkWr}%` : '—'}
              </td>
              <td className={`${cell} text-right ${avg.defWr !== null ? wrColor(avg.defWr) : 'text-siege-muted'}`}>
                {avg.defWr !== null ? `${avg.defWr}%` : '—'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
