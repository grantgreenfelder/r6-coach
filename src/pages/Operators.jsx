import { useState, use } from 'react'
import { Link } from 'react-router-dom'
import { operatorsPromise } from '../data/operatorsResource'
import { playersPromise, normalizeOp } from '../data/playersResource'
import { getPortraitUrl } from '../utils/operatorPortraits'
import { opWrColor } from '../utils/constants'
import PlayerAvatar from '../components/PlayerAvatar.jsx'

const SIDE_COLORS = {
  ATK: { dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/30' },
  DEF: { dot: 'bg-blue-400',   text: 'text-blue-400',   badge: 'bg-blue-400/10 text-blue-400 border-blue-400/30' },
}

// Min team rounds before an operator's WR is trusted for WR-based sorting
const WR_SORT_MIN_ROUNDS = 10

// Build a lookup: normalized op name → [player names] who main it, derived from
// live data (a "main" is an operator in a player's top 2 by rounds for that side).
function buildMainsMap(operatorStats) {
  const map = {}
  for (const [key, { rows }] of Object.entries(operatorStats || {})) {
    const mains = rows.filter(r => r.isMain).map(r => r.player)
    if (mains.length > 0) map[key] = mains
  }
  return map
}

// Build a lookup: normalized op name → round-weighted team aggregate { rounds, wr, kd }
function buildOpAgg(operatorStats) {
  const agg = {}
  for (const [key, { rows }] of Object.entries(operatorStats || {})) {
    let rounds = 0, wrSum = 0, kdSum = 0
    for (const r of rows) { rounds += r.rounds; wrSum += r.winRate * r.rounds; kdSum += r.kd * r.rounds }
    if (rounds > 0) agg[key] = { rounds, wr: +(wrSum / rounds).toFixed(1), kd: +(kdSum / rounds).toFixed(2) }
  }
  return agg
}

function OperatorTile({ op, mainsMap, teamStat }) {
  const [imgError, setImgError] = useState(false)
  const portraitSrc = getPortraitUrl(op.name)
  const mains = mainsMap[normalizeOp(op.name)] || []

  return (
    <Link
      to={`/operators/${op.name}`}
      className="group flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border border-siege-border
                 bg-siege-card hover:border-siege-accent/50 hover:bg-siege-accent/5 transition-all relative"
    >
      {/* Portrait */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0">
        {!imgError ? (
          <img
            src={portraitSrc}
            alt={op.name}
            loading="lazy"
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-siege-accent/60 select-none">
            {op.name[0]}
          </span>
        )}
        {teamStat && (
          <span
            title={`Team: ${teamStat.rounds}r · ${teamStat.wr}% WR · ${teamStat.kd} K/D`}
            className={`absolute top-0.5 right-0.5 text-[9px] font-bold leading-none px-1 py-0.5 rounded bg-black/80 ${opWrColor(teamStat.wr)}`}
          >
            {teamStat.wr}%
          </span>
        )}
      </div>
      {/* Name */}
      <span className="text-white text-[11px] font-medium text-center leading-tight group-hover:text-siege-accent transition-colors w-full line-clamp-2">
        {op.name.replace(/_/g, ' ')}
      </span>
      {/* Player mains chips */}
      {mains.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {mains.map(name => (
            <div key={name} title={name}>
              <PlayerAvatar name={name} size="xs" />
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

function OpGrid({ operators, mainsMap, opAgg }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {operators.map(op => (
        <OperatorTile key={op.name} op={op} mainsMap={mainsMap} teamStat={opAgg[normalizeOp(op.name)]} />
      ))}
    </div>
  )
}

function CategoryGroup({ category, operators, side, mainsMap, opAgg }) {
  const colors = SIDE_COLORS[side]
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{category}</span>
        <span className="ml-1 bg-siege-border text-siege-muted text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
          {operators.length}
        </span>
      </div>
      <OpGrid operators={operators} mainsMap={mainsMap} opAgg={opAgg} />
    </div>
  )
}

const LENSES = [
  { key: 'category', label: 'Category' },
  { key: 'played',   label: 'Most Played' },
  { key: 'wr',       label: 'Best WR' },
  { key: 'worst',    label: 'Needs Work' },
  { key: 'unplayed', label: 'Unplayed' },
]

export default function Operators() {
  const operatorsData = use(operatorsPromise)
  const playersData = use(playersPromise)
  const mainsMap = buildMainsMap(playersData._operatorStats)
  const opAgg    = buildOpAgg(playersData._operatorStats)
  const [activeSide, setActiveSide] = useState('ATK')
  const [search, setSearch] = useState('')
  const [lens, setLens]     = useState('category')
  const ops = activeSide === 'ATK' ? operatorsData.atk : operatorsData.def
  const categories = activeSide === 'ATK' ? operatorsData.atkCategories : operatorsData.defCategories

  const q = search.toLowerCase().trim()
  const isSearching = q.length > 0

  const flatFiltered = isSearching
    ? ops.filter(o => o.name.toLowerCase().replace(/_/g, ' ').includes(q))
    : []

  // Operators sorted/filtered by the active team-stats lens (non-category views)
  const lensOps = (() => {
    if (lens === 'category') return []
    const withAgg = ops.map(o => ({ op: o, agg: opAgg[normalizeOp(o.name)] }))
    if (lens === 'played')   return withAgg.filter(x => x.agg).sort((a, b) => b.agg.rounds - a.agg.rounds)
    if (lens === 'wr')       return withAgg.filter(x => x.agg && x.agg.rounds >= WR_SORT_MIN_ROUNDS).sort((a, b) => b.agg.wr - a.agg.wr)
    if (lens === 'worst')    return withAgg.filter(x => x.agg && x.agg.rounds >= WR_SORT_MIN_ROUNDS).sort((a, b) => a.agg.wr - b.agg.wr)
    if (lens === 'unplayed') return withAgg.filter(x => !x.agg)
    return withAgg
  })().map(x => x.op)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Operators</h1>
          <p className="text-siege-muted text-sm mt-1">
            {operatorsData.atk.length} attackers · {operatorsData.def.length} defenders
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search operators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-siege-card border border-siege-border rounded px-3 py-2.5 sm:py-1.5 text-sm text-white placeholder-siege-muted focus:outline-none focus:border-siege-accent w-44"
          />

          {/* ATK / DEF toggle */}
          <div className="flex rounded-lg border border-siege-border overflow-hidden">
            {['ATK', 'DEF'].map(side => (
              <button
                key={side}
                onClick={() => { setActiveSide(side); setSearch('') }}
                className={`px-5 py-2 text-sm font-semibold transition-colors ${
                  activeSide === side
                    ? side === 'ATK'
                      ? 'bg-orange-400/20 text-orange-400'
                      : 'bg-blue-400/20 text-blue-400'
                    : 'text-siege-muted hover:text-white'
                }`}
              >
                {side === 'ATK' ? 'Attack' : 'Defense'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lens control — view the catalog through the team's live stats */}
      {!isSearching && (
        <div className="flex items-center gap-1 flex-wrap -mt-2">
          <span className="text-siege-muted text-xs mr-1">View:</span>
          {LENSES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLens(key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                lens === key ? 'bg-siege-accent text-siege-bg' : 'text-siege-muted hover:text-white border border-siege-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <p className="text-siege-muted text-xs flex flex-wrap items-center gap-x-4 gap-y-1 -mt-2">
        <span className="inline-flex items-center gap-1">
          <PlayerAvatar name={playersData.mainStack?.[0]?.name || 'Grant'} size="xs" />
          {' '}= most-played op (hover for name)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/80 text-siege-green">%</span>
          = team win rate on this op
        </span>
      </p>

      {/* Search takes priority over lens */}
      {isSearching ? (
        flatFiltered.length > 0 ? (
          <div>
            <p className="text-siege-muted text-xs mb-3">{flatFiltered.length} result{flatFiltered.length !== 1 ? 's' : ''}</p>
            <OpGrid operators={flatFiltered} mainsMap={mainsMap} opAgg={opAgg} />
          </div>
        ) : (
          <p className="text-siege-muted text-center py-12">No operators match "{search}"</p>
        )
      ) : lens === 'category' ? (
        <div className="space-y-7">
          {categories.map(cat => {
            const catOps = ops.filter(o => o.category === cat)
            if (catOps.length === 0) return null
            return <CategoryGroup key={cat} category={cat} operators={catOps} side={activeSide} mainsMap={mainsMap} opAgg={opAgg} />
          })}
        </div>
      ) : lensOps.length > 0 ? (
        <div>
          <p className="text-siege-muted text-xs mb-3">
            {lensOps.length} operator{lensOps.length !== 1 ? 's' : ''}
            {lens === 'unplayed' ? ' the team hasn’t played this season'
              : (lens === 'wr' || lens === 'worst') ? ` · ${WR_SORT_MIN_ROUNDS}+ team rounds` : ''}
          </p>
          <OpGrid operators={lensOps} mainsMap={mainsMap} opAgg={opAgg} />
        </div>
      ) : (
        <p className="text-siege-muted text-center py-12">No operators to show for this view.</p>
      )}
    </div>
  )
}
