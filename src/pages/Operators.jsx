import { useState } from 'react'
import { Link } from 'react-router-dom'
import operatorsData from '../data/operators.json'

const SIDE_COLORS = {
  ATK: { dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/30' },
  DEF: { dot: 'bg-blue-400',   text: 'text-blue-400',   badge: 'bg-blue-400/10 text-blue-400 border-blue-400/30' },
}

function OperatorTile({ op }) {
  const [imgError, setImgError] = useState(false)
  return (
    <Link
      to={`/operators/${op.name}`}
      className="group flex flex-col items-center gap-1.5 p-3 rounded-lg border border-siege-border
                 bg-siege-card hover:border-siege-accent/50 hover:bg-siege-accent/5 transition-all"
    >
      {/* Portrait */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0">
        {!imgError ? (
          <img
            src={op.imageUrl}
            alt={op.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-siege-accent/60 select-none">
            {op.name[0]}
          </span>
        )}
      </div>
      {/* Name */}
      <span className="text-white text-xs font-medium text-center leading-tight group-hover:text-siege-accent transition-colors">
        {op.name.replace(/_/g, ' ')}
      </span>
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
        <span className="text-siege-muted text-xs ml-1">{operators.length}</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {operators.map(op => <OperatorTile key={op.name} op={op} />)}
      </div>
    </div>
  )
}

export default function Operators() {
  const [activeSide, setActiveSide] = useState('ATK')
  const ops = activeSide === 'ATK' ? operatorsData.atk : operatorsData.def
  const categories = activeSide === 'ATK' ? operatorsData.atkCategories : operatorsData.defCategories
  const colors = SIDE_COLORS[activeSide]

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

        {/* ATK / DEF toggle */}
        <div className="flex rounded-lg border border-siege-border overflow-hidden">
          {['ATK', 'DEF'].map(side => (
            <button
              key={side}
              onClick={() => setActiveSide(side)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                activeSide === side
                  ? side === 'ATK'
                    ? 'bg-orange-400/20 text-orange-400'
                    : 'bg-blue-400/20 text-blue-400'
                  : 'text-siege-muted hover:text-white'
              }`}
            >
              {side === 'ATK' ? '⚔ Attack' : '🛡 Defense'}
            </button>
          ))}
        </div>
      </div>

      {/* Category groups */}
      <div className="space-y-7">
        {categories.map(cat => {
          const catOps = ops.filter(o => o.category === cat)
          if (catOps.length === 0) return null
          return <CategoryGroup key={cat} category={cat} operators={catOps} side={activeSide} />
        })}
      </div>
    </div>
  )
}
