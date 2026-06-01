import { lazy, Suspense, useState, use } from 'react'
import { Link } from 'react-router-dom'
const ComparePanel = lazy(() =>
  import('./Compare.jsx').then(m => ({ default: m.ComparePanel }))
)
import { playersPromise } from '../data/playersResource'
import { risTextColor, wrColor, kdColor } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import PlayerAvatar from '../components/PlayerAvatar.jsx'
import RisBar from '../components/RisBar.jsx'
import PortraitChip from '../components/PortraitChip.jsx'

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
  const displayKd  = parseFloat(kd)      ? kd      : '—'
  const displayRis = parseFloat(ris)     ? ris     : '—'
  const displayWr  = parseFloat(winRate) ? winRate : '—'
  const wrNum      = parseFloat(winRate) || 0
  const dimCls     = player.team === 'main' ? '' : 'opacity-75'
  const topAtk     = player._topAtkOps ?? []
  const topDef     = player._topDefOps ?? []

  return (
    <Link
      to={`/players/${player.name}`}
      className={`card hover:border-siege-accent transition-all hover:opacity-100 group ${dimCls}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PlayerAvatar name={player.name} size="sm" />
          <div className="min-w-0">
            <span className="text-white font-semibold group-hover:text-siege-accent transition-colors block truncate">{player.name}</span>
            {player.role && <span className="text-gray-500 text-xs block truncate">{shortRole(player.role)}</span>}
          </div>
        </div>
        <span className="text-siege-muted text-xs flex-shrink-0 ml-2">{shortRank(rank)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${kdColor(kd)}`}>{displayKd}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">K/D <HelpTip text={GLOSSARY.KD} /></p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${risTextColor(ris)}`}>{displayRis}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">RIS <HelpTip text={GLOSSARY.RIS} /></p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${wrNum ? wrColor(wrNum) : 'text-white'}`}>{displayWr}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">Win% <HelpTip text={GLOSSARY.WR} /></p>
        </div>
      </div>

      <RisBar ris={ris} />
      <div className="flex justify-between text-xs text-siege-muted mb-2">
        <span className="flex items-center gap-1">RIS <HelpTip text={GLOSSARY.RIS_BAR} position="bottom" /></span>
        {parseFloat(ris) ? <span>baseline 50</span> : <span className="italic">no data</span>}
      </div>

      {(topAtk.length > 0 || topDef.length > 0) ? (
        <div className="flex gap-3 mt-1">
          {topAtk.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-orange-400 text-[10px] font-semibold uppercase">Atk</span>
              {topAtk.map(n => <PortraitChip key={n} name={n} size="w-5 h-5" />)}
            </div>
          )}
          {topDef.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-blue-400 text-[10px] font-semibold uppercase">Def</span>
              {topDef.map(n => <PortraitChip key={n} name={n} size="w-5 h-5" />)}
            </div>
          )}
        </div>
      ) : (
        <p className="text-siege-muted text-xs italic">No operator data</p>
      )}
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Players() {
  const playersData = use(playersPromise)
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
      if (sortBy === 'ris')  return (parseFloat(b.stats?.ris)    || 0) - (parseFloat(a.stats?.ris)    || 0)
      if (sortBy === 'kd')   return (parseFloat(b.stats?.kd)     || 0) - (parseFloat(a.stats?.kd)     || 0)
      if (sortBy === 'wr')   return (parseFloat(b.stats?.winRate) || 0) - (parseFloat(a.stats?.winRate) || 0)
      if (sortBy === 'esr')  return (parseFloat(b.stats?.esr)    || 0) - (parseFloat(a.stats?.esr)    || 0)
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
              {[['ris', 'RIS'], ['kd', 'K/D'], ['wr', 'Win%'], ['esr', 'ESR'], ['name', 'A–Z']].map(([val, label]) => (
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
