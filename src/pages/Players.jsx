import { useState } from 'react'
import { Link } from 'react-router-dom'
import playersData from '../data/players.json'

function PlayerCard({ player }) {
  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent/50 transition-colors group block"
    >
      {/* Name + role */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold flex-shrink-0">
          {player.name[0]}
        </div>
        <div className="min-w-0">
          <div className="text-white font-semibold group-hover:text-siege-accent transition-colors">{player.name}</div>
          {player.role && <div className="text-gray-500 text-xs truncate">{player.role}</div>}
        </div>
      </div>

      {/* Bio */}
      {player.bio && (
        <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-3">{player.bio}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'K/D', value: player.stats.kd },
          { label: 'RIS', value: player.stats.ris },
          { label: 'Win%', value: player.stats.winRate },
        ].map(({ label, value }) => (
          <div key={label} className="bg-black/30 rounded p-2 text-center">
            <div className="text-white text-sm font-medium">{value || '—'}</div>
            <div className="text-gray-500 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Ops */}
      <div className="text-xs text-gray-500">
        <span className="text-gray-400">Attack:</span> {player.atkOps || '—'}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        <span className="text-gray-400">Defense:</span> {player.defOps || '—'}
      </div>
    </Link>
  )
}

export default function Players() {
  const { mainStack, bTeam } = playersData
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('ris')
  const allPlayers = [
    ...mainStack.map(p => ({ ...p, team: 'main' })),
    ...bTeam.map(p => ({ ...p, team: 'bteam' })),
  ]

  const filtered = allPlayers
    .filter(p => {
      const q = search.toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'ris') return (parseFloat(b.stats?.ris) || 0) - (parseFloat(a.stats?.ris) || 0)
      if (sortBy === 'kd')  return (parseFloat(b.stats?.kd)  || 0) - (parseFloat(a.stats?.kd)  || 0)
      if (sortBy === 'wr')  return (parseFloat(b.stats?.winRate) || 0) - (parseFloat(a.stats?.winRate) || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Roster</h1>
        <p className="text-siege-muted text-sm mt-1">Player profiles and season stats</p>
      </div>

      {/* Search + filters */}
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
                sortBy === val ? 'bg-siege-accent text-siege-bg' : 'bg-siege-card border border-siege-border text-siege-muted hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-siege-muted text-sm text-center py-12">No players match "{search}"</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => <PlayerCard key={p.name} player={p} />)}
        </div>
      )}
    </div>
  )
}
