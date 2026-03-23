import { useState } from 'react'
import playersData from '../data/players.json'
import stackData from '../data/stack.json'
import mapsData from '../data/maps.json'
import handoffData from '../data/handoff.json'
import MarkdownContent from '../components/MarkdownContent'
import RatingBadge from '../components/RatingBadge'

const MAIN_STACK = ['Grant', 'Peej', 'Hound', 'Smigs', 'Sarge']
const B_TEAM = ['Slug', 'Krafty', 'Bob', 'Hunter']
const ALL_PLAYERS = [...MAIN_STACK, ...B_TEAM]

export default function SessionPrep() {
  const [roster, setRoster] = useState(
    Object.fromEntries(MAIN_STACK.map(p => [p, true]))
  )
  const [activeTab, setActiveTab] = useState('brief')

  const tonight = ALL_PLAYERS.filter(p => roster[p])

  const allPlayers = [...playersData.mainStack, ...playersData.bTeam, ...playersData.other]
  const tonightPlayers = tonight.map(name => allPlayers.find(p => p.name === name)).filter(Boolean)

  // Map pool — sort by rating
  const ratingOrder = ['strong', 'moderate', 'weak', 'avoid', 'unknown']
  const sortedMaps = [...mapsData].sort(
    (a, b) => ratingOrder.indexOf(a.rating) - ratingOrder.indexOf(b.rating)
  )
  const strongMaps = sortedMaps.filter(m => m.rating === 'strong' || m.rating === 'moderate')
  const avoidMaps = sortedMaps.filter(m => m.rating === 'avoid' || m.rating === 'weak')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Session Prep</h1>

      {/* Roster selector */}
      <div className="card">
        <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Tonight's Roster</h2>
        <div className="flex flex-wrap gap-2">
          {MAIN_STACK.map(name => (
            <PlayerToggle key={name} name={name} active={roster[name]} team="main"
              onToggle={() => setRoster(r => ({ ...r, [name]: !r[name] }))} />
          ))}
          <div className="w-px bg-siege-border mx-1" />
          {B_TEAM.map(name => (
            <PlayerToggle key={name} name={name} active={roster[name]} team="b"
              onToggle={() => setRoster(r => ({ ...r, [name]: !r[name] }))} />
          ))}
        </div>
        <p className="text-siege-muted text-xs mt-3">
          {tonight.length} player{tonight.length !== 1 ? 's' : ''} tonight: {tonight.join(', ') || 'none selected'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-siege-border">
        {['brief', 'map veto'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Brief tab */}
      {activeTab === 'brief' && (
        <div className="space-y-4">
          {/* Team focus */}
          {stackData.coachingItems && (
            <div className="card">
              <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Team Focus</h2>
              <MarkdownContent content={stackData.coachingItems} />
            </div>
          )}

          {/* Player callouts */}
          <div className="card">
            <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Player Callouts</h2>
            {tonightPlayers.length > 0 ? (
              <div className="space-y-4">
                {tonightPlayers.map(player => (
                  <PlayerCallout key={player.name} player={player} />
                ))}
              </div>
            ) : (
              <p className="text-siege-muted text-sm">Select players above to see callouts.</p>
            )}
          </div>
        </div>
      )}

      {/* Map veto tab */}
      {activeTab === 'map veto' && (
        <div className="space-y-4">
          {/* Map veto from STACK_05 */}
          <div className="card">
            <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-4">Map Veto Reference</h2>
            <MarkdownContent content={stackData.stack05Content} />
          </div>

          {/* Quick visual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-siege-green font-semibold text-sm mb-3">Play / Protect</h3>
              <div className="space-y-2">
                {strongMaps.map(m => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="text-white text-sm">{m.displayName}</span>
                    <RatingBadge rating={m.rating} label={m.ratingLabel} />
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="text-siege-red font-semibold text-sm mb-3">Ban / Avoid</h3>
              <div className="space-y-2">
                {avoidMaps.map(m => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="text-white text-sm">{m.displayName}</span>
                    <RatingBadge rating={m.rating} label={m.ratingLabel} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function PlayerToggle({ name, active, team, onToggle }) {
  const baseColor = team === 'main'
    ? active ? 'bg-siege-accent border-siege-accent text-siege-bg' : 'border-siege-border text-siege-muted'
    : active ? 'bg-siege-blue border-siege-blue text-white' : 'border-siege-border text-siege-muted'

  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 text-sm rounded border font-medium transition-colors hover:opacity-90 ${baseColor}`}
    >
      {name}
    </button>
  )
}

function PlayerCallout({ player }) {
  const priorities = player.coachingPriorities
  return (
    <div className="border-b border-siege-border/50 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-siege-accent flex items-center justify-center text-sm font-bold text-siege-bg flex-shrink-0">
            {player.name[0]}
          </div>
          <div>
            <span className="text-white font-semibold">{player.name}</span>
            {player.role && <span className="text-siege-muted text-xs ml-2">{player.role}</span>}
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="text-white">{player.stats.kd}</span>
          <span className="text-siege-muted"> K/D</span>
        </div>
      </div>
      {priorities.length > 0 ? (
        <div className="mt-2 ml-11 space-y-1">
          {priorities.slice(0, 2).map((p, i) => (
            <p key={i} className="text-sm text-gray-300">
              <span className="text-siege-accent">→ </span>{p}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 ml-11 text-siege-muted text-sm">No coaching priorities extracted</p>
      )}
    </div>
  )
}
