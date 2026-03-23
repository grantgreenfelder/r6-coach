import { Link } from 'react-router-dom'
import playersData from '../data/players.json'

function PlayerCard({ player }) {
  const teamCls = player.team === 'Main' ? 'badge-main' : 'badge-bteam'
  const teamLabel = player.team === 'Main' ? 'Main Stack' : 'B Team'

  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent/50 transition-colors group block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold">
            {player.name[0]}
          </div>
          <div>
            <div className="text-white font-semibold group-hover:text-siege-accent transition-colors">{player.name}</div>
            <div className="text-gray-500 text-xs">{player.tracker}</div>
          </div>
        </div>
        <span className={teamCls}>{teamLabel}</span>
      </div>

      <div className="text-xs text-gray-400 mb-3">{player.role || '—'}</div>

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Roster</h1>
        <p className="text-siege-muted text-sm mt-1">Main stack and B Team player profiles</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-siege-accent uppercase tracking-widest mb-3">Main Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainStack.map(p => <PlayerCard key={p.name} player={p} />)}
        </div>
      </div>

      {bTeam.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">B Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bTeam.map(p => <PlayerCard key={p.name} player={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
