import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
const ComparePanel = lazy(() =>
  import('./Compare.jsx').then(m => ({ default: m.ComparePanel }))
)
import playersData from '../data/players.json'
import { RIS_MIN, RIS_MAX, RIS_BASELINE_PCT, risColor, risTextColor, wrColor } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import { getPortraitUrl } from '../utils/operatorPortraits'
import PlayerAvatar from '../components/PlayerAvatar.jsx'

// ─── RIS Bar ──────────────────────────────────────────────────────────────────
// Always renders the track so the bar isn't just missing for low-data players.
function RisBar({ ris }) {
  const risNum = parseFloat(ris)
  const hasData = !isNaN(risNum)
  const fillPct = hasData
    ? Math.max(0, Math.min(100, ((risNum - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100))
    : 0
  const color = hasData ? risColor(ris) : ''

  return (
    <div className="relative h-2 bg-siege-border rounded-full overflow-visible mb-1">
      {hasData && (
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${color}`}
          style={{ width: `${fillPct}%` }}
        />
      )}
      <div
        className="absolute top-0 h-full w-px bg-white/30"
        style={{ left: `${RIS_BASELINE_PCT}%` }}
      />
    </div>
  )
}

// ─── Op Portrait Chips ────────────────────────────────────────────────────────
function PortraitChip({ name, size = 'w-5 h-5' }) {
  const [err, setErr] = useState(false)
  return (
    <div
      className={`${size} rounded overflow-hidden bg-siege-border flex-shrink-0 ring-1 ring-siege-border flex items-center justify-center`}
      title={name}
    >
      {!err ? (
        <img
          src={getPortraitUrl(name)}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-top"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-siege-accent text-[8px] font-bold leading-none select-none">{name[0]}</span>
      )}
    </div>
  )
}

function OpChips({ label, opsString }) {
  if (!opsString) return null
  const ops = opsString.split(/[,/]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 text-[10px]">{label}</span>
      {ops.map(name => <PortraitChip key={name} name={name} />)}
    </div>
  )
}

// Normalize long rank strings to something card-friendly
function shortRank(rank) {
  if (!rank) return ''
  if (/unranked/i.test(rank)) return 'Unranked'
  // "Emerald III", "Platinum IV" etc — fine as-is
  return rank
}

// Role field can contain long coaching notes for C Team players — cap at first sentence
function shortRole(role) {
  if (!role) return ''
  const dot = role.indexOf('.')
  return dot > 0 && dot < 40 ? role.slice(0, dot) : role
}

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player }) {
  const { kd, ris, winRate, rank } = player.stats || {}

  // Only show clean numeric values — long "N/A — ..." strings fall through to —
  const displayKd  = parseFloat(kd)  ? kd  : '—'
  const displayRis = parseFloat(ris) ? ris : '—'
  const displayWr  = parseFloat(winRate) ? winRate : '—'
  const wrNum = parseFloat(winRate) || 0

  // Non-main players get a subtly dimmer card to signal secondary tier
  const dimCls = player.team === 'main' ? '' : 'opacity-75'

  return (
    <Link
      to={`/players/${player.name}`}
      className={`card hover:border-siege-accent transition-all hover:opacity-100 group ${dimCls}`}
    >
      {/* Name + rank */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PlayerAvatar name={player.name} size="sm" />
          <div className="min-w-0">
            <span className="text-white font-semibold group-hover:text-siege-accent transition-colors block truncate">
              {player.name}
            </span>
            {player.role && (
              <span className="text-gray-500 text-xs block truncate">{shortRole(player.role)}</span>
            )}
          </div>
        </div>
        <span className="text-siege-muted text-xs flex-shrink-0 ml-2">{shortRank(rank)}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-white text-lg font-bold leading-none">{displayKd}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">
            K/D <HelpTip text={GLOSSARY.KD} />
          </p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${risTextColor(ris)}`}>{displayRis}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">
            RIS <HelpTip text={GLOSSARY.RIS} />
          </p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${wrNum ? wrColor(wrNum) : 'text-white'}`}>
            {displayWr}
          </p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">
            Win% <HelpTip text={GLOSSARY.WR} />
          </p>
        </div>
      </div>

      {/* RIS bar — always shown, empty if no data */}
      <RisBar ris={ris} />
      <div className="flex justify-between text-xs text-siege-muted mb-2">
        <span className="flex items-center gap-1">RIS <HelpTip text={GLOSSARY.RIS_BAR} position="bottom" /></span>
        {parseFloat(ris) ? <span>baseline 50</span> : <span className="italic">no data</span>}
      </div>

      {/* Op portrait chips — or placeholder if none */}
      {(player.atkOps || player.defOps) ? (
        <div className="flex gap-3">
          <OpChips label="Atk" opsString={player.atkOps} />
          <OpChips label="Def" opsString={player.defOps} />
        </div>
      ) : (
        <p className="text-siege-muted text-xs italic">Operators not tracked</p>
      )}
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Players() {
  const { mainStack, bTeam, other = [] } = playersData
  const [view, setView]     = useState('roster') // 'roster' | 'compare'
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('ris')

  const allPlayers = [
    ...mainStack.map(p => ({ ...p, team: 'main' })),
    ...bTeam.map(p => ({ ...p, team: 'bteam' })),
    ...other.map(p => ({ ...p, team: 'other' })),
  ]

  const filtered = allPlayers
    .filter(p => {
      const q = search.toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'ris')  return (parseFloat(b.stats?.ris)     || 0) - (parseFloat(a.stats?.ris)     || 0)
      if (sortBy === 'kd')   return (parseFloat(b.stats?.kd)      || 0) - (parseFloat(a.stats?.kd)      || 0)
      if (sortBy === 'wr')   return (parseFloat(b.stats?.winRate)  || 0) - (parseFloat(a.stats?.winRate)  || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="space-y-5">
      {/* Page header + view toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {view === 'roster' ? 'Roster' : 'Compare'}
          </h1>
          <p className="text-siege-muted text-sm mt-1">
            {view === 'roster'
              ? 'Player profiles and season stats'
              : 'Side-by-side stats, map performance, and operator overlap'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-siege-card border border-siege-border rounded-lg p-1 flex-shrink-0">
          {[['roster', 'Roster'], ['compare', 'Compare']].map(([val, label]) => (
            <button key={val} onClick={() => setView(val)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === val
                  ? 'bg-siege-accent text-siege-bg'
                  : 'text-siege-muted hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'roster' ? (
        <>
          {/* Search + sort — unified filter bar */}
          <div className="flex items-center gap-2 bg-siege-card border border-siege-border rounded-lg px-3 py-2 flex-wrap">
            <input
              type="text"
              aria-label="Search players"
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-siege-muted focus:outline-none flex-1 min-w-[140px]"
            />
            <div className="w-px h-4 bg-siege-border flex-shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-siege-muted text-xs mr-1">Sort:</span>
              {[['ris', 'RIS'], ['kd', 'K/D'], ['wr', 'Win%'], ['name', 'A–Z']].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className={`px-2.5 py-2 sm:py-1 rounded text-xs font-medium transition-colors ${
                    sortBy === val
                      ? 'bg-siege-accent text-siege-bg'
                      : 'text-siege-muted hover:text-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-siege-muted text-sm text-center py-12">No players match "{search}"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => <PlayerCard key={p.name} player={p} />)}
            </div>
          )}
        </>
      ) : (
        <Suspense fallback={<div className="text-siege-muted text-sm text-center py-12">Loading...</div>}>
          <ComparePanel />
        </Suspense>
      )}
    </div>
  )
}
