import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import playersData from '../data/players.json'
import PlayerAvatar from '../components/PlayerAvatar.jsx'
import { risTextColor, risColor, wrColor, kdColor, opWrColor, RIS_MIN, RIS_MAX, RIS_BASELINE_PCT } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_PLAYERS = [
  ...playersData.mainStack.map(p => ({ ...p, teamLabel: 'Main Stack' })),
  ...playersData.bTeam.map(p => ({ ...p, teamLabel: 'B Team' })),
]

function statVal(val) {
  if (!val || val === '—') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

// Strip trailing % so parseFloat works on "46.9%"
function cleanPct(val) {
  if (!val) return null
  return parseFloat(String(val).replace('%', ''))
}

// Highlight the best value in a row
function bestIndex(values, higherIsBetter = true) {
  const nums = values.map(v => (v === null ? (higherIsBetter ? -Infinity : Infinity) : v))
  const best = higherIsBetter ? Math.max(...nums) : Math.min(...nums)
  if (!isFinite(best)) return -1
  const idx = nums.indexOf(best)
  // Only highlight if at least 2 valid values
  const validCount = values.filter(v => v !== null).length
  return validCount >= 2 ? idx : -1
}

// RIS mini-bar (same pattern as Players page)
function RisBar({ ris }) {
  const risNum = parseFloat(ris)
  const hasData = !isNaN(risNum)
  const fillPct = hasData
    ? Math.max(0, Math.min(100, ((risNum - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100))
    : 0
  const color = hasData ? risColor(ris) : ''
  return (
    <div className="relative h-1.5 bg-siege-border rounded-full overflow-visible mt-1">
      {hasData && (
        <div className={`absolute top-0 left-0 h-full rounded-full ${color}`} style={{ width: `${fillPct}%` }} />
      )}
      <div className="absolute top-0 h-full w-px bg-white/30" style={{ left: `${RIS_BASELINE_PCT}%` }} />
    </div>
  )
}

// ─── Player Selector ──────────────────────────────────────────────────────────

function PlayerSelector({ selected, onToggle }) {
  const mainStack = ALL_PLAYERS.filter(p => p.teamLabel === 'Main Stack')
  const bTeam = ALL_PLAYERS.filter(p => p.teamLabel === 'B Team')

  function renderGroup(players, label) {
    return (
      <div>
        <p className="text-siege-muted text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {players.map(p => {
            const isSelected = selected.includes(p.name)
            const isDisabled = !isSelected && selected.length >= 5
            return (
              <button
                key={p.name}
                onClick={() => !isDisabled && onToggle(p.name)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  isSelected
                    ? 'bg-siege-accent/20 border-siege-accent text-siege-accent'
                    : isDisabled
                    ? 'border-siege-border text-siege-muted opacity-40 cursor-not-allowed'
                    : 'border-siege-border text-gray-400 hover:border-gray-500 hover:text-white cursor-pointer'
                }`}
              >
                <PlayerAvatar name={p.name} size="xs" />
                <span>{p.name}</span>
                {isSelected && (
                  <span className="text-siege-accent/60 text-xs leading-none">×</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Select Players to Compare</h2>
        <span className="text-siege-muted text-xs">{selected.length}/5 selected</span>
      </div>
      {renderGroup(mainStack, 'Main Stack')}
      {renderGroup(bTeam, 'B Team')}
    </div>
  )
}

// ─── Stat Comparison Table ─────────────────────────────────────────────────────

// ESR colour: 0.55+ good, 0.45+ ok, below bad
function esrColor(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return 'text-siege-muted'
  if (n >= 0.55) return 'text-siege-green'
  if (n >= 0.45) return 'text-blue-300'
  if (n >= 0.38) return 'text-yellow-400'
  return 'text-siege-red'
}
// Clutch WR colour (small numbers — 25%+ good)
function clutchWrColor(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return 'text-siege-muted'
  if (n >= 30) return 'text-siege-green'
  if (n >= 20) return 'text-blue-300'
  if (n >= 12) return 'text-yellow-400'
  return 'text-siege-red'
}
// HS% colour: R6 average is ~40%, so 50%+ is strong
function hsColor(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return 'text-siege-muted'
  if (n >= 50) return 'text-siege-green'
  if (n >= 40) return 'text-blue-300'
  if (n >= 30) return 'text-yellow-400'
  return 'text-siege-red'
}

// Section dividers — fake rows with no data, just a label
const SECTION = (label) => ({ _section: true, label })

const STAT_ROWS = [
  SECTION('Overview'),
  { key: 'rank',     label: 'Rank',        format: v => v || '—',  color: () => 'text-gray-300', higherIsBetter: true, noHighlight: true },
  { key: 'ris',      label: 'RIS',         format: v => v ?? '—',  color: risTextColor,  higherIsBetter: true, helpKey: 'RIS', showBar: true },
  { key: 'winRate',  label: 'Win %',        format: v => v ?? '—',  color: wrColor,       higherIsBetter: true, helpKey: 'WR' },
  { key: 'matches',  label: 'Matches',     format: v => v ?? '—',  color: () => 'text-siege-muted', higherIsBetter: true, noHighlight: true },
  { key: 'rp',       label: 'RP',          format: v => v ? Number(v).toLocaleString() : '—', color: () => 'text-gray-300', higherIsBetter: true, noHighlight: true },

  SECTION('Kills & Efficiency'),
  { key: 'kd',       label: 'K/D',         format: v => v ?? '—',  color: kdColor,       higherIsBetter: true, helpKey: 'KD' },
  { key: 'kda',      label: 'KDA',         format: v => v ?? '—',  color: kdColor,       higherIsBetter: true },
  { key: 'kills',    label: 'Kills',       format: v => v ?? '—',  color: () => 'text-gray-300', higherIsBetter: true, noHighlight: true },
  { key: 'deaths',   label: 'Deaths',      format: v => v ?? '—',  color: () => 'text-gray-300', higherIsBetter: false, noHighlight: true },
  { key: 'hs',       label: 'HS %',         format: v => v !== '—' && v ? `${parseFloat(v).toFixed(1)}%` : '—', color: hsColor, higherIsBetter: true },

  SECTION('Round Impact'),
  { key: 'esr',      label: 'ESR',         format: v => v ?? '—',  color: esrColor,      higherIsBetter: true },
  { key: 'clutches', label: 'Clutches Won',format: v => v ?? '—',  color: () => 'text-gray-300', higherIsBetter: true },
  { key: 'clutchWR', label: 'Clutch Win %', format: v => v !== '—' && v ? `${parseFloat(v).toFixed(1)}%` : '—', color: clutchWrColor, higherIsBetter: true },
]

function StatTable({ players }) {
  return (
    <div className="card overflow-x-auto">
      <h2 className="text-white font-semibold text-sm mb-4">Season Stats — Head to Head</h2>
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="border-b border-siege-border">
            <th className="text-left text-siege-muted text-xs font-medium pb-2 w-24">Stat</th>
            {players.map(p => (
              <th key={p.name} className="text-center pb-2 min-w-[100px]">
                <Link to={`/players/${p.name}`} className="group inline-flex flex-col items-center gap-1">
                  <PlayerAvatar name={p.name} size="sm" />
                  <span className="text-white text-xs font-semibold group-hover:text-siege-accent transition-colors">{p.name}</span>
                  <span className="text-gray-500 text-[10px] leading-none">{p.teamLabel}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STAT_ROWS.map((row, rowIdx) => {
            // Section divider row
            if (row._section) {
              return (
                <tr key={`section-${rowIdx}`}>
                  <td colSpan={players.length + 1} className="pt-4 pb-1">
                    <span className="text-siege-accent text-[10px] font-semibold uppercase tracking-widest">{row.label}</span>
                  </td>
                </tr>
              )
            }

            const rawVals = players.map(p => {
              const s = p.stats || {}
              return s[row.key]
            })

            // Build numeric values for best-highlight
            const numVals = rawVals.map(v => {
              if (row.key === 'winRate' || row.key === 'clutchWR' || row.key === 'hs') return cleanPct(v)
              return statVal(v)
            })

            const best = row.noHighlight ? -1 : bestIndex(numVals, row.higherIsBetter)

            return (
              <tr key={row.key} className="border-b border-siege-border/30 last:border-0">
                <td className="py-2.5 text-siege-muted text-xs font-medium">
                  <span className="flex items-center gap-1">
                    {row.label}
                    {row.helpKey && <HelpTip text={GLOSSARY[row.helpKey]} />}
                  </span>
                </td>
                {players.map((p, i) => {
                  const raw = rawVals[i]
                  const numericVal = numVals[i]
                  const displayVal = row.format(raw)
                  const colorCls = numericVal !== null ? row.color(numericVal) : 'text-siege-muted'
                  const isBest = i === best
                  return (
                    <td key={p.name} className="py-2.5 text-center relative">
                      {isBest && (
                        <span className="absolute inset-x-2 inset-y-0.5 bg-siege-accent/5 rounded pointer-events-none" />
                      )}
                      <span className={`font-semibold relative ${colorCls}`}>{displayVal}</span>
                      {row.showBar && (
                        <div className="px-3">
                          <RisBar ris={raw} />
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Map Comparison Table ──────────────────────────────────────────────────────

function MapComparison({ players }) {
  const [sort, setSort] = useState('matches')

  // Collect all maps that appear for any selected player
  const allMaps = useMemo(() => {
    const mapSet = new Set()
    players.forEach(p => {
      (p.mapPerformance || []).forEach(m => mapSet.add(m.map))
    })
    return Array.from(mapSet)
  }, [players])

  if (allMaps.length === 0) return null

  // Build a lookup: { mapName: { playerName: { wr, kd, matches } } }
  const lookup = {}
  players.forEach(p => {
    (p.mapPerformance || []).forEach(m => {
      if (!lookup[m.map]) lookup[m.map] = {}
      lookup[m.map][p.name] = m
    })
  })

  // Sort maps by total matches, or alphabetically
  const sortedMaps = [...allMaps].sort((a, b) => {
    if (sort === 'matches') {
      const totalA = players.reduce((sum, p) => sum + (lookup[a][p.name]?.matches || 0), 0)
      const totalB = players.reduce((sum, p) => sum + (lookup[b][p.name]?.matches || 0), 0)
      return totalB - totalA
    }
    return a.localeCompare(b)
  })

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-white font-semibold text-sm">Map Win Rate — Side by Side</h2>
        <div className="flex items-center gap-1">
          <span className="text-siege-muted text-xs mr-1">Sort:</span>
          {[['matches', 'By Matches'], ['alpha', 'A–Z']].map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sort === val ? 'bg-siege-accent text-siege-bg' : 'text-siege-muted hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="border-b border-siege-border">
            <th className="text-left text-siege-muted text-xs font-medium pb-2 w-28">Map</th>
            {players.map(p => (
              <th key={p.name} className="text-center text-xs text-siege-muted font-medium pb-2 min-w-[90px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedMaps.map(mapName => {
            const wrs = players.map(p => lookup[mapName][p.name]?.winRate ?? null)
            const best = bestIndex(wrs, true)

            return (
              <tr key={mapName} className="border-b border-siege-border/40 last:border-0">
                <td className="py-2 text-gray-400 text-xs font-medium">
                  <Link to={`/maps/${mapName.toLowerCase().replace(/\s+/g, '-')}`}
                    className="hover:text-siege-accent transition-colors">
                    {mapName}
                  </Link>
                </td>
                {players.map((p, i) => {
                  const mdata = lookup[mapName][p.name]
                  const wr = mdata?.winRate ?? null
                  const matches = mdata?.matches ?? null
                  const isBest = i === best
                  return (
                    <td key={p.name} className={`py-2 text-center relative ${isBest ? '' : ''}`}>
                      {isBest && wr !== null && (
                        <span className="absolute inset-x-1 inset-y-0.5 bg-siege-accent/5 rounded pointer-events-none" />
                      )}
                      {wr !== null ? (
                        <div className="relative">
                          <span className={`font-semibold text-sm ${wrColor(wr)}`}>{wr.toFixed(1)}%</span>
                          <span className="block text-[10px] text-gray-600 leading-none mt-0.5">{matches}M</span>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Operator Overlap ──────────────────────────────────────────────────────────

function OperatorOverlap({ players }) {
  const [side, setSide] = useState('atk')

  // operators shape: { atk: [{name, rounds, winRate, kd, ...}], def: [...] }
  const allOps = useMemo(() => {
    const opSet = new Set()
    players.forEach(p => {
      const list = p.operators?.[side] || []
      list.forEach(op => opSet.add(op.name))
    })
    return Array.from(opSet).sort()
  }, [players, side])

  // Build lookup: opName → { playerName: opEntry }
  const lookup = useMemo(() => {
    const result = {}
    players.forEach(p => {
      const list = p.operators?.[side] || []
      list.forEach(op => {
        if (!result[op.name]) result[op.name] = {}
        result[op.name][p.name] = op
      })
    })
    return result
  }, [players, side])

  // Only show ops that at least 2 players have played (meaningful overlap)
  const sharedOps = allOps.filter(op => {
    const count = players.filter(p => lookup[op]?.[p.name]).length
    return count >= 1
  })

  // Sort by: number of players who play it (desc), then alphabetically
  const sortedOps = [...sharedOps].sort((a, b) => {
    const countA = players.filter(p => lookup[a]?.[p.name]).length
    const countB = players.filter(p => lookup[b]?.[p.name]).length
    if (countB !== countA) return countB - countA
    return a.localeCompare(b)
  })

  if (sortedOps.length === 0) return null

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-white font-semibold text-sm">Operator Overlap</h2>
        <div className="flex items-center gap-1">
          {[['atk', 'Attack'], ['def', 'Defence']].map(([val, label]) => (
            <button key={val} onClick={() => setSide(val)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                side === val ? 'bg-siege-accent text-siege-bg' : 'text-siege-muted hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="border-b border-siege-border">
            <th className="text-left text-siege-muted text-xs font-medium pb-2 w-28">Operator</th>
            {players.map(p => (
              <th key={p.name} className="text-center text-xs text-siege-muted font-medium pb-2 min-w-[90px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedOps.map(opName => {
            const wrs = players.map(p => {
              const opData = lookup[opName]?.[p.name]
              return opData ? parseFloat(opData.winRate) ?? null : null
            })
            const best = bestIndex(wrs, true)
            const playCount = players.filter(p => lookup[opName]?.[p.name]).length

            return (
              <tr key={opName} className="border-b border-siege-border/40 last:border-0">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/operators/${opName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-gray-400 text-xs font-medium hover:text-siege-accent transition-colors">
                      {opName}
                    </Link>
                    {playCount >= 2 && (
                      <span className="text-[9px] text-siege-accent/60 font-medium bg-siege-accent/10 px-1 rounded">×{playCount}</span>
                    )}
                  </div>
                </td>
                {players.map((p, i) => {
                  const opData = lookup[opName]?.[p.name]
                  const wr = opData ? parseFloat(opData.winRate) : null
                  const rounds = opData?.rounds
                  const isBest = i === best
                  return (
                    <td key={p.name} className="py-2 text-center relative">
                      {isBest && wr !== null && (
                        <span className="absolute inset-x-1 inset-y-0.5 bg-siege-accent/5 rounded pointer-events-none" />
                      )}
                      {opData ? (
                        <div className="relative">
                          <span className={`font-semibold text-sm ${wr !== null ? wrColor(wr) : 'text-gray-400'}`}>
                            {wr !== null ? `${wr.toFixed(1)}%` : '—'}
                          </span>
                          {rounds && <span className="block text-[10px] text-gray-600 leading-none mt-0.5">{rounds}R</span>}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-siege-muted text-[10px] mt-3">×N = number of selected players who run this operator. WR = win rate on operator. R = rounds played.</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Compare() {
  const [selected, setSelected] = useState([])
  const [activeView, setActiveView] = useState('stats') // 'stats' | 'maps' | 'ops'

  function togglePlayer(name) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const selectedPlayers = ALL_PLAYERS.filter(p => selected.includes(p.name))

  const hasEnough = selectedPlayers.length >= 2

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Compare</h1>
        <p className="text-siege-muted text-sm mt-1">Side-by-side stats, map performance, and operator overlap</p>
      </div>

      {/* Player Selector */}
      <PlayerSelector selected={selected} onToggle={togglePlayer} />

      {!hasEnough && (
        <div className="text-center py-12 text-siege-muted text-sm">
          Select at least 2 players to compare
        </div>
      )}

      {hasEnough && (
        <>
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-siege-card border border-siege-border rounded-lg p-1 w-fit">
            {[['stats', 'Season Stats'], ['maps', 'Map WR'], ['ops', 'Operator Overlap']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveView(val)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeView === val
                    ? 'bg-siege-accent text-siege-bg'
                    : 'text-siege-muted hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Content panels */}
          {activeView === 'stats' && <StatTable players={selectedPlayers} />}
          {activeView === 'maps' && <MapComparison players={selectedPlayers} />}
          {activeView === 'ops' && <OperatorOverlap players={selectedPlayers} />}
        </>
      )}
    </div>
  )
}
