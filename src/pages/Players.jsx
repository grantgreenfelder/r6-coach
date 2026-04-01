import { useState } from 'react'
import { Link } from 'react-router-dom'
import playersData from '../data/players.json'
import { RIS_MIN, RIS_MAX, RIS_BASELINE_PCT, risColor, wrColor } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import { getPortraitUrl } from '../utils/operatorPortraits'

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
function OpChips({ label, opsString }) {
  if (!opsString) return null
  const ops = opsString.split(/[,/]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 text-[10px]">{label}</span>
      {ops.map(name => (
        <div
          key={name}
          className="w-5 h-5 rounded overflow-hidden bg-siege-border flex-shrink-0 ring-1 ring-siege-border"
          title={name}
        >
          <img
            src={getPortraitUrl(name)}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      ))}
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

  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent transition-colors group"
    >
      {/* Name + rank */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-sm flex-shrink-0">
            {player.name[0]}
          </div>
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
          <p className="text-siege-accent text-lg font-bold leading-none">{displayRis}</p>
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
        <span>baseline 50</span>
      </div>

      {/* Op portrait chips */}
      {(player.atkOps || player.defOps) && (
        <div className="flex gap-3">
          <OpChips label="Atk" opsString={player.atkOps} />
          <OpChips label="Def" opsString={player.defOps} />
        </div>
      )}
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Players() {
  const { mainStack, bTeam, other = [] } = playersData
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
      <div>
        <h1 className="text-2xl font-bold text-white">Roster</h1>
        <p className="text-siege-muted text-sm mt-1">Player profiles and season stats</p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          aria-label="Search players"
          placeholder="Search by name or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-siege-card border border-siege-border rounded px-3 py-1.5 text-sm text-white placeholder:text-siege-muted focus:outline-none focus:border-siege-accent flex-1 min-w-[180px] max-w-xs"
        />
        <div className="flex gap-1 ml-auto">
          <span className="text-siege-muted text-xs self-center mr-1">Sort:</span>
          {[['ris', 'RIS'], ['kd', 'K/D'], ['wr', 'Win%'], ['name', 'A–Z']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                sortBy === val
                  ? 'bg-siege-accent text-siege-bg'
                  : 'bg-siege-card border border-siege-border text-siege-muted hover:text-white'
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
    </div>
  )
}
