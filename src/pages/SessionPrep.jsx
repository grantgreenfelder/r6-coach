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
          <TeamFocus />
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

function TeamFocus() {
  const items = stackData.teamFocusItems || []
  if (items.length === 0) return null

  return (
    <div className="card">
      <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-3">Team Focus</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-siege-accent font-bold text-sm flex-shrink-0 w-5">{i + 1}.</span>
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
      <div className="w-8 sm:w-12 flex-shrink-0 text-center">
        {isBan ? (
          <span className="text-[10px] sm:text-xs font-bold text-siege-red bg-siege-red/20 rounded px-1 sm:px-1.5 py-0.5">
            BAN{banSlot}
          </span>
        ) : (
          <span className="text-xs text-siege-muted">{idx + 1}</span>
        )}
      </div>

      {/* Map name — flex-1 so it fills remaining space */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate block ${isBan ? 'text-white' : 'text-gray-300'}`}>
          {map.displayName}
        </span>
      </div>

      {/* Win rate */}
      <div className="w-14 sm:w-20 flex-shrink-0 text-right sm:text-left">
        {wr !== null ? (
          <span className={`text-sm font-bold ${wrColor}`}>{wr}%</span>
        ) : (
          <span className="text-xs text-siege-muted">—</span>
        )}
      </div>

      {/* Mini win% bar — visible on sm+ */}
      <div className="w-20 hidden sm:block flex-shrink-0">
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

      {/* Per-player dots — md+ only */}
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

      {/* Sample size — hidden on mobile */}
      <div className="hidden sm:block w-12 text-right flex-shrink-0">
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
  const { kd, ris, winRate, rank } = player.stats
  const kdNum = parseFloat(kd)
  const wrNum = parseFloat(winRate)
  const risNum = parseFloat(ris)

  // Derive positive trends from stats
  const positives = []
  if (!isNaN(kdNum) && kdNum >= 1.15) positives.push(`Fragging well — ${kd} K/D this season`)
  if (!isNaN(wrNum) && wrNum >= 50) positives.push(`Winning rounds — ${winRate} win rate`)
  if (!isNaN(risNum) && risNum >= 60) positives.push(`High impact — ${ris} RIS`)
  if (player.defOps) positives.push(`${player.defOps} DEF identity is established`)

  // Best map
  const maps = player.mapPerformance || []
  const bestMap = maps.filter(m => m.matches >= 5).sort((a, b) => b.winRate - a.winRate)[0]
  if (bestMap) positives.push(`Strong on ${bestMap.map} — ${bestMap.winRate}% WR (${bestMap.matches}M)`)

  // Coaching priorities as "to work on"
  const workOn = player.coachingPriorities || []

  // Weak map
  const weakMap = maps.filter(m => m.matches >= 5).sort((a, b) => a.winRate - b.winRate)[0]

  return (
    <div className="border-b border-siege-border/50 pb-4 last:border-0 last:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
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
          <span><span className="text-siege-muted">K/D </span><span className="text-white font-medium">{kd ?? '—'}</span></span>
          <span><span className="text-siege-muted">RIS </span><span className="text-siege-accent font-medium">{ris ?? '—'}</span></span>
          <span><span className="text-siege-muted">Win </span><span className="text-white font-medium">{winRate ?? '—'}</span></span>
        </div>
      </div>

      <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {/* Positives */}
        {positives.length > 0 && (
          <div>
            <p className="text-siege-green text-xs font-semibold uppercase tracking-wide mb-1">What's working</p>
            <ul className="space-y-0.5">
              {positives.slice(0, 2).map((p, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-siege-green flex-shrink-0">✓</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Work on */}
        {(workOn.length > 0 || weakMap) && (
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1">To work on</p>
            <ul className="space-y-0.5">
              {workOn.slice(0, 2).map((p, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-yellow-400 flex-shrink-0">→</span>{p}
                </li>
              ))}
              {workOn.length === 0 && weakMap && (
                <li className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-yellow-400 flex-shrink-0">→</span>
                  Weak on {weakMap.map} — {weakMap.winRate}% WR ({weakMap.matches}M)
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
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
