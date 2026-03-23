import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import mapsData from '../data/maps.json'
import MarkdownContent from '../components/MarkdownContent'
import StatusDot from '../components/StatusDot'

export default function StratViewer() {
  const { mapName, side, site } = useParams()
  const map = mapsData.find(m => m.name === mapName)
  const [showRaw, setShowRaw] = useState(false)

  if (!map) {
    return (
      <div className="p-8 text-center">
        <p className="text-siege-muted text-lg">Map not found: {mapName}</p>
        <Link to="/maps" className="text-siege-accent hover:underline mt-4 inline-block">← Back to Maps</Link>
      </div>
    )
  }

  // Decode and match the strat
  const decodedSite = decodeURIComponent(site)
  const sideUpper = side.toUpperCase()
  const strat = map.strats.find(
    s => s.side === sideUpper && s.site === decodedSite
  )

  if (!strat) {
    return (
      <div className="p-8 text-center">
        <p className="text-siege-muted text-lg">Strat not found: {sideUpper} {decodedSite}</p>
        <Link to={`/maps/${mapName}`} className="text-siege-accent hover:underline mt-4 inline-block">← Back to {map.displayName}</Link>
      </div>
    )
  }

  const sideColor = strat.side === 'ATK' ? 'text-siege-accent' : 'text-siege-blue'
  const sideBorder = strat.side === 'ATK' ? 'border-siege-accent' : 'border-siege-blue'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-siege-muted">
        <Link to="/maps" className="hover:text-siege-accent">Maps</Link>
        <span>/</span>
        <Link to={`/maps/${mapName}`} className="hover:text-siege-accent">{map.displayName}</Link>
        <span>/</span>
        <span className={sideColor}>{strat.side}</span>
        <span>/</span>
        <span className="text-white">{strat.site}</span>
      </div>

      {/* Header */}
      <div className={`card border-l-4 ${sideBorder}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-sm font-bold ${sideColor}`}>{strat.side}</span>
              <StatusDot status={strat.status} showLabel />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {map.displayName} — {strat.site}
            </h1>
          </div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs border border-siege-border text-siege-muted hover:text-white hover:border-siege-muted rounded px-2 py-1 transition-colors"
          >
            {showRaw ? 'Rendered View' : 'Raw Markdown'}
          </button>
        </div>
      </div>

      {/* Role Table */}
      {strat.roles.length > 0 && (
        <div className="card">
          <h2 className="text-siege-accent font-semibold text-sm uppercase tracking-wider mb-4">
            {strat.side === 'ATK' ? 'Role Assignments' : 'Anchor Assignments'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siege-border">
                  {Object.keys(strat.roles[0]).map(col => (
                    <th key={col} className="text-left py-2 pr-4 text-siege-muted font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strat.roles.map((row, i) => (
                  <tr key={i} className="border-b border-siege-border/50 hover:bg-siege-surface/50 transition-colors">
                    {Object.values(row).map((cell, j) => (
                      <td key={j} className={`py-2 pr-4 ${j === 0 ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {cell || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full strat content */}
      <div className="card">
        {showRaw ? (
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
            {strat.content}
          </pre>
        ) : (
          <MarkdownContent content={strat.content} />
        )}
      </div>

      {/* Navigation between strats on this map */}
      <StratNav currentStrat={strat} allStrats={map.strats} mapName={mapName} />
    </div>
  )
}

function StratNav({ currentStrat, allStrats, mapName }) {
  const currentIdx = allStrats.findIndex(
    s => s.side === currentStrat.side && s.site === currentStrat.site
  )
  const prev = currentIdx > 0 ? allStrats[currentIdx - 1] : null
  const next = currentIdx < allStrats.length - 1 ? allStrats[currentIdx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="flex justify-between pt-4 border-t border-siege-border">
      {prev ? (
        <Link
          to={`/maps/${mapName}/${prev.side.toLowerCase()}/${encodeURIComponent(prev.site)}`}
          className="text-siege-muted hover:text-siege-accent text-sm flex items-center gap-1"
        >
          ← {prev.side} {prev.site}
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/maps/${mapName}/${next.side.toLowerCase()}/${encodeURIComponent(next.site)}`}
          className="text-siege-muted hover:text-siege-accent text-sm flex items-center gap-1"
        >
          {next.side} {next.site} →
        </Link>
      ) : <div />}
    </div>
  )
}
