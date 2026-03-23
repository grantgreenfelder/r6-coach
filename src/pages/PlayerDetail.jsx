import { useParams, Link } from 'react-router-dom'
import playersData from '../data/players.json'
import MarkdownContent from '../components/MarkdownContent'

export default function PlayerDetail() {
  const { name } = useParams()
  const all = [...playersData.mainStack, ...playersData.bTeam, ...playersData.other]
  const player = all.find(p => p.name.toLowerCase() === name.toLowerCase())

  if (!player) {
    return (
      <div className="p-8 text-center">
        <p className="text-siege-muted text-lg">Player not found: {name}</p>
        <Link to="/players" className="text-siege-accent hover:underline mt-4 inline-block">← Back to Players</Link>
      </div>
    )
  }

  const isMain = playersData.mainStack.some(p => p.name === player.name)
  const teamLabel = isMain ? 'Main Stack' : 'B Team'
  const teamColor = isMain ? 'text-siege-gold' : 'text-siege-blue'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/players" className="text-siege-muted hover:text-siege-accent text-sm">← Players</Link>
      </div>

      <div className="card flex items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-siege-accent flex items-center justify-center text-2xl font-bold text-siege-bg flex-shrink-0">
          {player.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{player.name}</h1>
            <span className={`text-sm font-medium ${teamColor}`}>{teamLabel}</span>
            {player.tracker && (
              <a
                href={`https://r6.tracker.network/r6siege/profile/ubi/${player.tracker}/overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-siege-muted hover:text-siege-accent border border-siege-border rounded px-2 py-0.5"
              >
                r6.tracker ↗
              </a>
            )}
          </div>
          {player.role && <p className="text-siege-muted mt-1">{player.role}</p>}
          <div className="flex gap-4 mt-3 flex-wrap">
            {player.atkOps && (
              <span className="text-sm"><span className="text-siege-muted">ATK: </span><span className="text-white">{player.atkOps}</span></span>
            )}
            {player.defOps && (
              <span className="text-sm"><span className="text-siege-muted">DEF: </span><span className="text-white">{player.defOps}</span></span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
          <StatBox label="Rank" value={player.stats.rank} />
          <StatBox label="K/D" value={player.stats.kd} />
          <StatBox label="Win Rate" value={player.stats.winRate} />
          <StatBox label="Matches" value={player.stats.matches} />
        </div>
      </div>

      {/* Tabs / Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coaching Priorities */}
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Coaching Priorities</h2>
          {player.coachingPriorities.length > 0 ? (
            <ul className="space-y-2">
              {player.coachingPriorities.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-siege-accent font-bold">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-siege-muted text-sm">No priorities extracted</p>
          )}
        </div>

        {/* Season Stats */}
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">
            Season — {player.season}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatRow label="Rank" value={player.stats.rank} />
            <StatRow label="RP" value={player.stats.rp} />
            <StatRow label="K/D" value={player.stats.kd} />
            <StatRow label="Win Rate" value={player.stats.winRate} />
            <StatRow label="Matches" value={player.stats.matches} />
          </div>
        </div>
      </div>

      {/* Full COACHING.md */}
      {player.coachingContent && (
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-4">Full Coaching Notes</h2>
          <MarkdownContent content={player.coachingContent} />
        </div>
      )}

      {/* Full Season file */}
      {player.seasonContent && (
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-4">Season File — {player.season}</h2>
          <MarkdownContent content={player.seasonContent} />
        </div>
      )}

      {/* Profile */}
      {player.profileContent && (
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-4">Player Profile</h2>
          <MarkdownContent content={player.profileContent} />
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-white font-bold text-lg">{value || '—'}</div>
      <div className="text-siege-muted text-xs">{label}</div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-siege-border pb-2">
      <span className="text-siege-muted text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value || '—'}</span>
    </div>
  )
}
