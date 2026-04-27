import { useState } from 'react'
import { Link } from 'react-router-dom'
import operatorsData from '../data/operators.json'
import playersData from '../data/players.json'
import { getPortraitUrl } from '../utils/operatorPortraits'
import PlayerAvatar from '../components/PlayerAvatar.jsx'

const SIDE_COLORS = {
  ATK: { dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/30' },
  DEF: { dot: 'bg-blue-400',   text: 'text-blue-400',   badge: 'bg-blue-400/10 text-blue-400 border-blue-400/30' },
}

// Build a lookup: normalized op name → [full player names] who play it
function buildMainsMap() {
  const allPlayers = [
    ...(playersData.mainStack || []),
    ...(playersData.bTeam || []),
  ]
  const map = {}
  const normalize = s => s.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '').replace(/ü/g, 'u')
  for (const player of allPlayers) {
    const ops = [...(player.atkOps || '').split(/[,/]/), ...(player.defOps || '').split(/[,/]/)]
      .map(s => s.trim()).filter(Boolean)
    for (const op of ops) {
      const key = normalize(op)
      if (!map[key]) map[key] = []
      map[key].push(player.name)
    }
  }
  return map
}

const MAINS_MAP = buildMainsMap()

function OperatorTile({ op }) {
  const [imgError, setImgError] = useState(false)
  const portraitSrc = getPortraitUrl(op.name)
  const normalizedKey = op.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '').replace(/ü/g, 'u')
  const mains = MAINS_MAP[normalizedKey] || []

  return (
    <Link
      to={`/operators/${op.name}`}
      className="group flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border border-siege-border
                 bg-siege-card hover:border-siege-accent/50 hover:bg-siege-accent/5 transition-all relative"
    >
      {/* Portrait */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0">
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

function CategoryGroup({ category, operators, side }) {
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {operators.map(op => <OperatorTile key={op.name} op={op} />)}
      </div>
    </div>
  )
}

export default function Operators() {
  const [activeSide, setActiveSide] = useState('ATK')
  const [search, setSearch] = useState('')
  const ops = activeSide === 'ATK' ? operatorsData.atk : operatorsData.def
  const categories = activeSide === 'ATK' ? operatorsData.atkCategories : operatorsData.defCategories

  const q = search.toLowerCase().trim()
  const isSearching = q.length > 0

  const flatFiltered = isSearching
    ? ops.filter(o => o.name.toLowerCase().replace(/_/g, ' ').includes(q))
    : []

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

      {/* Mains legend */}
      <p className="text-siege-muted text-xs -mt-3">
        <span className="inline-flex items-center gap-1">
          <PlayerAvatar name="Grant" size="xs" />
          {' '}= roster main — hover chip for player name
        </span>
      </p>

      {/* Search results — flat grid */}
      {isSearching ? (
        flatFiltered.length > 0 ? (
          <div>
            <p className="text-siege-muted text-xs mb-3">{flatFiltered.length} result{flatFiltered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {flatFiltered.map(op => <OperatorTile key={op.name} op={op} />)}
            </div>
          </div>
        ) : (
          <p className="text-siege-muted text-center py-12">No operators match "{search}"</p>
        )
      ) : (
        <div className="space-y-7">
          {categories.map(cat => {
            const catOps = ops.filter(o => o.category === cat)
            if (catOps.length === 0) return null
            return <CategoryGroup key={cat} category={cat} operators={catOps} side={activeSide} />
          })}
        </div>
      )}
    </div>
  )
}
