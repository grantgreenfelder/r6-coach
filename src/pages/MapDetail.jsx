import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import mapsData from '../data/maps.json'
import RatingBadge from '../components/RatingBadge'
import StatusDot from '../components/StatusDot'
import { NotFound } from '../components/EmptyState'
import MarkdownContent from '../components/MarkdownContent'
import { wrColor, wrBgColor, kdColor } from '../utils/constants'
import { getMapThumbnailUrl } from '../utils/mapThumbnails'

// Win rate bar + text colour helpers (mirrors Maps.jsx 5-tier logic)
function wrBarColor(wr) {
  if (wr === null) return ''
  if (wr >= 60) return 'bg-siege-green'
  if (wr >= 50) return 'bg-blue-500'
  if (wr >= 40) return 'bg-yellow-500'
  if (wr >= 30) return 'bg-orange-500'
  return 'bg-red-600'
}
function wrTextCol(wr) {
  if (wr === null) return 'text-siege-muted'
  if (wr >= 60) return 'text-siege-green'
  if (wr >= 50) return 'text-blue-400'
  if (wr >= 40) return 'text-yellow-400'
  if (wr >= 30) return 'text-orange-400'
  return 'text-red-400'
}

const POOL_BANNER = {
  first: {
    bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    icon: '⚠',
    text: <>In ranked pool now — <strong>leaving at the Y11S1 mid-season split</strong>. Strat this map before it rotates out.</>,
  },
  both: {
    bg: 'bg-siege-green/10 border-siege-green/30 text-siege-green',
    icon: '✓',
    text: <>In ranked pool for the <strong>full Y11S1 season</strong>.</>,
  },
  second: {
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    icon: '↩',
    text: <>Not in the current pool — <strong>returns at the Y11S1 mid-season split</strong>. Good time to build strats now.</>,
  },
  none: {
    bg: 'bg-siege-border/30 border-siege-border text-siege-muted',
    icon: '—',
    text: <>Not in the Y11S1 ranked pool.</>,
  },
}

export default function MapDetail() {
  const { mapName } = useParams()
  const map = mapsData.find(m => m.name === mapName)
  const [activeTab, setActiveTab] = useState('overview')
  const [sideFilter, setSideFilter] = useState('all')

  const availableSeasons = map
    ? Object.keys(map.playerStats || {}).sort().reverse()
    : []
  const [activeSeason, setActiveSeason] = useState(() => availableSeasons[0] || '')

  if (!map) {
    return <NotFound icon="🗺" title="Map not found" message={`"${mapName}" isn't in the map pool.`} backTo="/maps" backLabel="Back to Maps" />
  }

  const filteredStrats = map.strats.filter(s =>
    sideFilter === 'all' || s.side === sideFilter
  )
  const atkStrats = map.strats.filter(s => s.side === 'ATK')
  const defStrats = map.strats.filter(s => s.side === 'DEF')

  const poolKey = map.rankedPool || (!map.inRankedPool ? 'none' : null)
  const banner = poolKey ? POOL_BANNER[poolKey] : null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats',    label: 'Stats' },
    { id: 'strats',   label: 'Strats' },
    { id: 'reference',label: 'Wiki' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link to="/maps" className="text-siege-muted hover:text-siege-accent text-sm">← Maps</Link>

      {/* Header card — hero image + stats */}
      <div className="card overflow-hidden p-0">

        {/* Hero image with gradient overlay */}
        {(() => {
          const thumbUrl = getMapThumbnailUrl(map.name)
          return thumbUrl ? (
            <div className="relative h-36 sm:h-44 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ backgroundImage: `url(${thumbUrl})` }}
              />
              {/* dark gradient — heavier at bottom so text is readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-siege-card via-siege-card/60 to-black/20" />
              {/* Map name + rating pinned to bottom-left / right */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{map.displayName}</h1>
                <RatingBadge rating={map.rating} size="lg" />
              </div>
            </div>
          ) : (
            /* fallback: plain title row */
            <div className="px-4 pt-4 flex items-start justify-between flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-white">{map.displayName}</h1>
              <RatingBadge rating={map.rating} size="lg" />
            </div>
          )
        })()}

        {/* Card body */}
        <div className="px-4 pb-4 space-y-4 pt-3">

          {/* Pool banner */}
          {banner && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${banner.bg}`}>
              <span>{banner.icon}</span>
              <span>{banner.text}</span>
            </div>
          )}

          {/* Win rate comparison — Y11S1 vs Y10S4 */}
          <div className="grid grid-cols-2 gap-3">
            <WinRateBlock
              label="Y11S1"
              wr={map.teamWinRate}
              matches={map.teamWinRateMatches}
              current
            />
            <WinRateBlock
              label="Y10S4"
              wr={map.teamWinRateY10S4}
              matches={map.teamWinRateMatchesY10S4}
            />
          </div>

          {/* Strat progress */}
          <div>
            <div className="flex gap-6 text-sm mb-2">
              <StratStat label="Total Sites"  value={map.stratCount.total} />
              <StratStat label="Ready"        value={map.stratCount.developed}  color="text-siege-green" />
              <StratStat label="Partial"      value={map.stratCount.partial}    color="text-yellow-500" />
              <StratStat label="Not Started"  value={map.stratCount.total - map.stratCount.developed - map.stratCount.partial} color="text-siege-muted" />
            </div>
            {map.stratCount.total > 0 && (
              <div className="h-1.5 bg-siege-border rounded-full overflow-hidden flex">
                <div className="bg-siege-green h-full" style={{ width: `${(map.stratCount.developed / map.stratCount.total) * 100}%` }} />
                <div className="bg-yellow-500 h-full" style={{ width: `${(map.stratCount.partial / map.stratCount.total) * 100}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-siege-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        map.overviewContent
          ? <OverviewAccordion content={map.overviewContent} />
          : <div className="card"><p className="text-siege-muted">No overview file found for this map.</p></div>
      )}

      {/* ── Stats ── */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {availableSeasons.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-siege-muted">No player map data available yet.</p>
              <p className="text-siege-muted text-sm mt-1">Players appear here once they have 3+ ranked matches on this map.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {availableSeasons.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSeason(s)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      activeSeason === s
                        ? 'bg-siege-accent border-siege-accent text-siege-bg font-semibold'
                        : 'border-siege-border text-siege-muted hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <MapStatsTable rows={map.playerStats[activeSeason] || []} season={activeSeason} />
            </>
          )}
        </div>
      )}

      {/* ── Strats ── */}
      {activeTab === 'strats' && (
        <div className="space-y-6">

          {/* Legend + side filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs text-siege-muted">
              <span className="font-medium text-white">Status:</span>
              {[
                { status: 'developed',     label: 'Ready' },
                { status: 'partial',       label: 'In progress' },
                { status: 'not-developed', label: 'Not started' },
              ].map(({ status, label }) => (
                <span key={status} className="flex items-center gap-1.5">
                  <StatusDot status={status} />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'ATK', label: `Attack (${atkStrats.length})` },
                { value: 'DEF', label: `Defense (${defStrats.length})` },
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
          </div>

          {filteredStrats.length === 0 && (
            <p className="text-siege-muted text-center py-8">No strats for this filter.</p>
          )}

          {/* Attack section */}
          {(sideFilter === 'all' || sideFilter === 'ATK') && atkStrats.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-siege-accent text-xs font-bold uppercase tracking-wider">Attack</span>
                <div className="flex-1 h-px bg-siege-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {atkStrats.map(s => <StratCard key={s.filename} strat={s} mapName={mapName} />)}
              </div>
            </div>
          )}

          {/* Defense section */}
          {(sideFilter === 'all' || sideFilter === 'DEF') && defStrats.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-siege-blue text-xs font-bold uppercase tracking-wider">Defense</span>
                <div className="flex-1 h-px bg-siege-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defStrats.map(s => <StratCard key={s.filename} strat={s} mapName={mapName} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reference ── */}
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

// ── Sub-components ──────────────────────────────────────────────────────────

function WinRateBlock({ label, wr, matches, current }) {
  return (
    <div className={`rounded-lg p-3 border ${current ? 'border-siege-border bg-white/[0.03]' : 'border-siege-border/50'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${current ? 'text-white' : 'text-siege-muted'}`}>
          {label}
        </span>
        {wr !== null
          ? <span className={`text-sm font-bold ${wrTextCol(wr)}`}>{wr}%</span>
          : <span className="text-xs text-siege-muted">No data</span>
        }
      </div>
      <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${wrBarColor(wr)}`}
          style={{ width: wr !== null ? `${Math.min(wr, 100)}%` : '0%' }}
        />
      </div>
      {wr !== null && (
        <p className="text-xs text-siege-muted mt-1">{matches}M sample</p>
      )}
    </div>
  )
}

function StratCard({ strat, mapName }) {
  const isAtk = strat.side === 'ATK'
  const sideColor = isAtk ? 'text-siege-accent' : 'text-siege-blue'
  const encodedSite = encodeURIComponent(strat.site)
  const encodedSide = strat.side.toLowerCase()

  // Up to 3 role names, comma-separated
  const roleNames = strat.roles
    .slice(0, 3)
    .map(r => r.Role)
    .join(' · ')
  const hasMoreRoles = strat.roles.length > 3

  return (
    <Link
      to={`/maps/${mapName}/${encodedSide}/${encodedSite}`}
      className="card hover:border-siege-accent transition-colors block group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <StatusDot status={strat.status} />
          {strat.formation && (
            <span className={`text-xs font-mono border rounded px-1 py-0.5 ${isAtk ? 'border-siege-accent/30 text-siege-accent/70' : 'border-blue-500/30 text-blue-400/70'}`}>
              {strat.formation}
            </span>
          )}
        </div>
        <span className="text-siege-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
      </div>

      <h3 className="text-white font-semibold group-hover:text-siege-accent transition-colors leading-snug mb-1">
        {strat.site}
      </h3>

      {strat.siteContext && (
        <p className="text-siege-muted text-xs leading-relaxed line-clamp-2 mb-2">
          {strat.siteContext}
        </p>
      )}

      {roleNames && (
        <p className="text-xs text-siege-muted/70 mt-auto">
          {roleNames}{hasMoreRoles ? ` · +${strat.roles.length - 3} more` : ''}
        </p>
      )}
    </Link>
  )
}

// ── Overview accordion ────────────────────────────────────────────────────

function parseH2Sections(content) {
  const lines = content.split('\n')
  const preambleLines = []
  const sections = []
  let current = null
  let inPreamble = true

  for (const line of lines) {
    if (line.startsWith('## ')) {
      inPreamble = false
      if (current) sections.push({ ...current, content: current.lines.join('\n').trim() })
      current = { title: line.replace(/^##\s+/, ''), lines: [] }
    } else if (inPreamble) {
      preambleLines.push(line)
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push({ ...current, content: current.lines.join('\n').trim() })

  return { preamble: preambleLines.join('\n').trim(), sections }
}

// Sections to open by default (matched by title prefix)
const DEFAULT_OPEN = ['Overview', 'Bomb Sites']

function OverviewAccordion({ content }) {
  const { preamble, sections } = useMemo(() => parseH2Sections(content), [content])

  const [openSections, setOpenSections] = useState(
    () => new Set(sections.filter(s => DEFAULT_OPEN.some(d => s.title.startsWith(d))).map(s => s.title))
  )

  const allOpen   = openSections.size === sections.length
  const allClosed = openSections.size === 0

  const toggleSection = (title) =>
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })

  const setAll = (open) =>
    setOpenSections(open ? new Set(sections.map(s => s.title)) : new Set())

  return (
    <div className="space-y-2">
      {/* Preamble — always visible (warnings, notes) */}
      {preamble && (
        <div className="card">
          <MarkdownContent content={preamble} />
        </div>
      )}

      {/* Expand / Collapse all */}
      {sections.length > 1 && (
        <div className="flex justify-end gap-4 text-xs px-1">
          <button
            onClick={() => setAll(true)}
            disabled={allOpen}
            className="text-siege-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            Expand all
          </button>
          <button
            onClick={() => setAll(false)}
            disabled={allClosed}
            className="text-siege-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            Collapse all
          </button>
        </div>
      )}

      {/* Accordion sections */}
      {sections.map(section => {
        const isOpen = openSections.has(section.title)
        return (
          <div key={section.title} className="card overflow-hidden p-0">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className={`font-semibold text-sm ${isOpen ? 'text-white' : 'text-siege-muted'}`}>
                {section.title}
              </span>
              <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-siege-muted`}>
                ▼
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-siege-border">
                <MarkdownContent content={section.content} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StratStat({ label, value, color = 'text-white' }) {
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
        <p className="text-siege-muted text-sm mt-1">Players appear here once they have 3+ ranked matches on this map.</p>
      </div>
    )
  }

  const totalMatches = rows.reduce((s, r) => s + r.matches, 0)
  const wavg = (field) =>
    totalMatches > 0
      ? Math.round((rows.reduce((s, r) => s + r[field] * r.matches, 0) / totalMatches) * 10) / 10
      : null
  const avg = {
    matches: totalMatches,
    winRate: wavg('winRate'),
    kd:      totalMatches > 0 ? Math.round((rows.reduce((s,r) => s + r.kd * r.matches, 0) / totalMatches) * 100) / 100 : null,
    atkWr:   wavg('atkWr'),
    defWr:   wavg('defWr'),
  }

  const colHead = 'text-left text-xs text-siege-muted font-medium uppercase tracking-wide py-2 px-3'
  const cell    = 'py-2 px-3 text-sm'

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
            <tr key={row.callsign} className={`border-b border-siege-border/50 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
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
