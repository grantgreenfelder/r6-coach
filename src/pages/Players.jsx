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

  const allPlayers = [...mainStack, ...bTeam].sort((a, b) => {
    const risA = parseFloat(a.stats?.ris) || 0
    const risB = parseFloat(b.stats?.ris) || 0
    return risB - risA
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Roster</h1>
        <p className="text-siege-muted text-sm mt-1">Player profiles and season stats</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allPlayers.map(p => <PlayerCard key={p.name} player={p} />)}
      </div>
    </div>
  )
}
