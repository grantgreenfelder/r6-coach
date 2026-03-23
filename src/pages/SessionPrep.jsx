import { useState, useMemo } from 'react'
import playersData from '../data/players.json'
import stackData from '../data/stack.json'
import mapsData from '../data/maps.json'

const MAIN_STACK = ['Grant', 'Peej', 'Hound', 'Smigs', 'Sarge']
const B_TEAM = ['Slug', 'Krafty', 'Bob', 'Hunter']
const ALL_PLAYERS = [...MAIN_STACK, ...B_TEAM]

export default function SessionPrep() {
  const [roster, setRoster] = useState(
    Object.fromEntries(MAIN_STACK.map(p => [p, true]))
  )
  const [activeTab, setActiveTab] = useState('brief')

  const tonight = ALL_PLAYERS.filter(p => roster[p])
  const allPlayers = [...playersData.mainStack, ...playersData.bTeam, ...(playersData.other || [])]
  const tonightPlayers = tonight.map(name => allPlayers.find(p => p.name === name)).filter(Boolean)

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
          <TeamFocus tonight={tonight} />
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
        <MapVeto tonightPlayers={tonightPlayers} tonight={tonight} />
      )}
    </div>
  )
}

// ─── Team Focus ───────────────────────────────────────────────────────────────

function TeamFocus({ tonight }) {
  const items = stackData.coachingItemsStructured || []
  // Show item if it's team-wide OR the tagged player is playing tonight
  const relevant = items.filter(item => !item.playerTag || tonight.includes(item.playerTag))

  if (relevant.length === 0) return null

  return (
    <div className="card">
      <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Team Focus</h2>
      <div className="space-y-3">
        {relevant.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {item.playerTag ? (
                <span className="inline-block w-14 text-center text-xs px-1.5 py-0.5 rounded bg-siege-blue/20 text-siege-blue border border-siege-blue/30 font-medium">
                  {item.playerTag}
                </span>
              ) : (
                <span className="inline-block w-14 text-center text-xs px-1.5 py-0.5 rounded bg-siege-accent/10 text-siege-accent border border-siege-accent/20 font-medium">
                  Team
                </span>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{item.text}</p>
              {item.body && <p className="text-siege-muted text-xs mt-0.5 leading-relaxed">{item.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Map Veto ─────────────────────────────────────────────────────────────────

function MapVeto({ tonightPlayers, tonight }) {
  // Compute per-map win% for tonight's roster
  const rosterMapStats = useMemo(() => {
    return mapsData.map(map => {
      const playerRows = tonightPlayers.map(player => {
        const row = (player.mapPerformance || []).find(r => r.map === map.displayName)
        return row ? { name: player.name, matches: row.matches, winRate: row.winRate } : null
      }).filter(Boolean)

      const totalMatches = playerRows.reduce((s, r) => s + r.matches, 0)
      const weightedWin = playerRows.reduce((s, r) => s + r.winRate * r.matches, 0)
      const rosterWinRate = totalMatches > 0 ? Math.round((weightedWin / totalMatches) * 10) / 10 : null

      return { ...map, rosterWinRate, rosterMatches: totalMatches, playerRows }
    })
  }, [tonightPlayers])

  // Default sort: worst win% first (ban candidates at top), no-data maps at bottom
  const defaultOrder = useMemo(() =>
    [...rosterMapStats].sort((a, b) => {
      if (a.rosterWinRate === null && b.rosterWinRate === null) return a.displayName.localeCompare(b.displayName)
      if (a.rosterWinRate === null) return 1
      if (b.rosterWinRate === null) return -1
      return a.rosterWinRate - b.rosterWinRate
    }).map(m => m.name)
  , [rosterMapStats])

  const [mapOrder, setMapOrder] = useState(defaultOrder)

  // Reset order when roster changes (derived from tonight key)
  const tonightKey = tonight.sort().join(',')
  const [lastTonightKey, setLastTonightKey] = useState(tonightKey)
  if (tonightKey !== lastTonightKey) {
    setLastTonightKey(tonightKey)
    setMapOrder(defaultOrder)
  }

  const orderedMaps = mapOrder.map(name => rosterMapStats.find(m => m.name === name)).filter(Boolean)

  const moveUp = (idx) => {
    if (idx === 0) return
    const next = [...mapOrder]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setMapOrder(next)
  }

  const moveDown = (idx) => {
    if (idx === mapOrder.length - 1) return
    const next = [...mapOrder]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setMapOrder(next)
  }

  const resetOrder = () => setMapOrder(defaultOrder)

  const BAN_SLOTS = 2

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Map Veto — Tonight's Roster</h2>
          <p className="text-siege-muted text-xs mt-0.5">
            Win% computed for: {tonight.length > 0 ? tonight.join(', ') : 'no one selected'}
            {' · '}Worst maps at top · Use arrows to reorder
          </p>
        </div>
        <button
          onClick={resetOrder}
          className="text-xs border border-siege-border text-siege-muted hover:text-white hover:border-siege-muted rounded px-2 py-1 transition-colors"
        >
          Reset sort
        </button>
      </div>

      {/* Map list */}
      <div className="space-y-1">
        {orderedMaps.map((map, idx) => (
          <MapVetoRow
            key={map.name}
            map={map}
            idx={idx}
            total={orderedMaps.length}
            banSlot={idx < BAN_SLOTS ? idx + 1 : null}
            onMoveUp={() => moveUp(idx)}
            onMoveDown={() => moveDown(idx)}
            tonight={tonight}
          />
        ))}
      </div>
    </div>
  )
}

function MapVetoRow({ map, idx, total, banSlot, onMoveUp, onMoveDown, tonight }) {
  const isBan = banSlot !== null
  const wr = map.rosterWinRate
  const wrColor = wr === null ? 'text-siege-muted' :
    wr >= 55 ? 'text-siege-green' :
    wr >= 45 ? 'text-white' :
    wr >= 35 ? 'text-yellow-400' : 'text-siege-red'

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
      isBan
        ? 'bg-siege-red/10 border-siege-red/40'
        : idx < 5
        ? 'bg-siege-card/50 border-siege-border/50'
        : 'bg-siege-card/30 border-siege-border/30'
    }`}>
      {/* Ban label / rank number */}
      <div className="w-12 flex-shrink-0 text-center">
        {isBan ? (
          <span className="text-xs font-bold text-siege-red bg-siege-red/20 rounded px-1.5 py-0.5">
            BAN {banSlot}
          </span>
        ) : (
          <span className="text-xs text-siege-muted">{idx + 1}</span>
        )}
      </div>

      {/* Map name */}
      <div className="w-36 flex-shrink-0">
        <span className={`text-sm font-medium ${isBan ? 'text-white' : 'text-gray-300'}`}>
          {map.displayName}
        </span>
      </div>

      {/* Win rate */}
      <div className="w-20 flex-shrink-0">
        {wr !== null ? (
          <span className={`text-sm font-bold ${wrColor}`}>{wr}%</span>
        ) : (
          <span className="text-xs text-siege-muted">no data</span>
        )}
      </div>

      {/* Mini win% bar */}
      <div className="flex-1 hidden sm:block">
        <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              wr === null ? '' :
              wr >= 55 ? 'bg-siege-green' :
              wr >= 45 ? 'bg-blue-400' :
              wr >= 35 ? 'bg-yellow-500' : 'bg-siege-red'
            }`}
            style={{ width: wr !== null ? `${Math.min(wr, 100)}%` : '0%' }}
          />
        </div>
      </div>

      {/* Per-player dots */}
      <div className="hidden md:flex gap-1 flex-shrink-0">
        {tonight.map(name => {
          const row = map.playerRows?.find(r => r.name === name)
          const dotWr = row ? row.winRate : null
          const color = dotWr === null ? 'bg-siege-border' :
            dotWr >= 55 ? 'bg-siege-green' :
            dotWr >= 45 ? 'bg-blue-400' :
            dotWr >= 35 ? 'bg-yellow-500' : 'bg-siege-red'
          return (
            <div
              key={name}
              className={`w-2 h-2 rounded-full ${color}`}
              title={`${name}: ${dotWr !== null ? dotWr + '%' : 'no data'}`}
            />
          )
        })}
      </div>

      {/* Sample size */}
      <div className="w-12 text-right flex-shrink-0">
        {map.rosterMatches > 0 && (
          <span className="text-xs text-siege-muted">{map.rosterMatches}M</span>
        )}
      </div>

      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={idx === 0}
          className="text-siege-muted hover:text-white disabled:opacity-20 text-xs leading-none px-1"
        >▲</button>
        <button
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="text-siege-muted hover:text-white disabled:opacity-20 text-xs leading-none px-1"
        >▼</button>
      </div>
    </div>
  )
}

// ─── Player Callout ───────────────────────────────────────────────────────────

function PlayerCallout({ player }) {
  const priorities = player.coachingPriorities
  const { kd, ris, winRate, rank } = player.stats
  return (
    <div className="border-b border-siege-border/50 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-siege-accent flex items-center justify-center text-sm font-bold text-siege-bg flex-shrink-0">
            {player.name[0]}
          </div>
          <div>
            <span className="text-white font-semibold">{player.name}</span>
            <span className="text-siege-muted text-xs ml-2">{rank}</span>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          <span><span className="text-siege-muted">K/D </span><span className="text-white font-medium">{kd}</span></span>
          <span><span className="text-siege-muted">RIS </span><span className="text-white font-medium">{ris}</span></span>
          <span><span className="text-siege-muted">Win </span><span className="text-white font-medium">{winRate}</span></span>
        </div>
      </div>
      {(player.atkOps || player.defOps) && (
        <div className="mt-1.5 ml-11 flex gap-4 text-xs text-siege-muted">
          {player.atkOps && <span><span className="text-gray-500">Atk: </span>{player.atkOps}</span>}
          {player.defOps && <span><span className="text-gray-500">Def: </span>{player.defOps}</span>}
        </div>
      )}
      {priorities.length > 0 ? (
        <div className="mt-2 ml-11 space-y-1">
          {priorities.slice(0, 3).map((p, i) => (
            <p key={i} className="text-sm text-gray-300">
              <span className="text-siege-accent font-bold">{i + 1}. </span>{p}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 ml-11 text-siege-muted text-sm italic">No priorities on file</p>
      )}
    </div>
  )
}

// ─── Player Toggle ────────────────────────────────────────────────────────────

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
