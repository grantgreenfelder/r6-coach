import { use, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { playersPromise } from '../data/playersResource'
import {
  opWrColor, opWrBgColor, wrColor, kdColor,
  risTextColor, esrColor, hsColor, clutchWrColor,
} from '../utils/constants'
import { NotFound } from '../components/EmptyState'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import PlayerAvatar from '../components/PlayerAvatar.jsx'
import PortraitChip from '../components/PortraitChip.jsx'

// ─── Stat Box ──────────────────────────────────────────────────────────────────

function StatBox({ label, value, accent, tip, small }) {
  return (
    <div className="bg-black/30 border border-siege-border rounded-lg p-1.5 sm:p-3 text-center">
      <div className={`font-bold leading-none truncate ${small ? 'text-xs sm:text-base' : 'text-xs sm:text-xl'} ${accent || 'text-white'}`}>
        {value || '—'}
      </div>
      <div className="text-siege-muted text-[9px] sm:text-xs mt-1 uppercase tracking-wider flex items-center justify-center gap-0.5">
        {label}{tip && <HelpTip text={tip} />}
      </div>
    </div>
  )
}

// ─── Operator Table ────────────────────────────────────────────────────────────

const FLAG_LABEL = { '⭐': 'standout', '✅': 'solid', '⚠️': 'concern' }

function OpRow({ op, maxRounds, showExtra, dim }) {
  const wrCls      = opWrColor(op.winRate)
  const barColor   = opWrBgColor(op.winRate)
  const roundsPct  = maxRounds > 0 ? Math.min((op.rounds / maxRounds) * 100, 100) : 0
  const kdCls      = kdColor(op.kd)
  const fbFd       = (op.firstBloods ?? 0) + (op.firstDeaths ?? 0)
  const esr        = fbFd > 0 ? ((op.firstBloods ?? 0) / fbFd).toFixed(2) : null

  return (
    <div className={`flex items-center gap-2 py-1.5 border-b border-siege-border/40 last:border-0 ${dim ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0 min-w-0">
        <PortraitChip name={op.name} size="w-6 h-6" />
        <span className="text-white text-sm font-medium truncate">{op.name}</span>
        {op.flag && <span title={FLAG_LABEL[op.flag] || op.flag} className="text-xs leading-none flex-shrink-0">{op.flag}</span>}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="h-1 bg-siege-border rounded-full overflow-hidden">
          <div className="h-full bg-siege-muted/50 rounded-full" style={{ width: `${roundsPct}%` }} />
        </div>
        <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(op.winRate, 100)}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="text-right">
          <span className={`text-sm font-semibold tabular-nums ${wrCls}`}>{op.winRate}%</span>
          <span className="text-siege-muted text-xs ml-1 hidden sm:inline">WR</span>
        </div>
        <div className="text-right w-9 sm:w-10">
          <span className={`text-sm tabular-nums ${kdCls}`}>{op.kd}</span>
          <span className="text-siege-muted text-xs ml-0.5 hidden sm:inline">K/D</span>
        </div>
        {showExtra ? (
          <>
            <div className="text-right w-10 hidden sm:block">
              <span className={`text-xs tabular-nums ${hsColor(op.hs)}`}>{op.hs != null ? `${op.hs}%` : '—'}</span>
              <span className="text-siege-muted text-xs ml-0.5">HS</span>
            </div>
            <div className="text-right w-10 hidden sm:block">
              <span className={`text-xs tabular-nums ${esr ? esrColor(esr) : 'text-siege-muted'}`}>{esr ?? '—'}</span>
              <span className="text-siege-muted text-xs ml-0.5">ESR</span>
            </div>
          </>
        ) : (
          <div className="text-right w-8">
            <span className="text-siege-muted text-xs tabular-nums">{op.rounds}r</span>
          </div>
        )}
      </div>
    </div>
  )
}

function OpSideList({ ops, maxRounds, showExtra }) {
  const [showSmall, setShowSmall] = useState(false)
  const significant = ops.filter(o => !o.smallSample)
  const small       = ops.filter(o => o.smallSample)

  return (
    <>
      {significant.map(op => (
        <OpRow key={op.name} op={op} maxRounds={maxRounds} showExtra={showExtra} />
      ))}
      {small.length > 0 && (
        <>
          <button
            onClick={() => setShowSmall(s => !s)}
            className="w-full flex items-center gap-2 py-1.5 text-siege-muted hover:text-white transition-colors text-xs"
          >
            <div className="flex-1 h-px bg-siege-border/40" />
            <span>{showSmall ? 'Hide' : `+${small.length} low-volume ops`}</span>
            <div className="flex-1 h-px bg-siege-border/40" />
          </button>
          {showSmall && small.map(op => (
            <OpRow key={op.name} op={op} maxRounds={maxRounds} showExtra={showExtra} dim />
          ))}
        </>
      )}
    </>
  )
}

function OpsTable({ operators }) {
  const [showExtra, setShowExtra] = useState(false)
  const atk = operators?.atk || []
  const def  = operators?.def || []
  const maxAtk = Math.max(...atk.map(o => o.rounds), 1)
  const maxDef = Math.max(...def.map(o => o.rounds), 1)

  if (atk.length === 0 && def.length === 0) {
    return <p className="text-siege-muted text-sm">No operator data</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px] text-siege-muted">
          <span className="flex items-center gap-1.5"><span className="w-6 h-1 bg-siege-muted/40 rounded-full inline-block" />Rounds</span>
          <span className="flex items-center gap-1.5"><span className="w-6 h-1.5 bg-siege-green rounded-full inline-block" />Win%</span>
        </div>
        {/* Toggle only affects sm+ (HS%/ESR columns are hidden on mobile) */}
        <button
          onClick={() => setShowExtra(x => !x)}
          className={`hidden sm:block text-xs px-2.5 py-1 rounded border transition-colors ${showExtra ? 'border-siege-border text-siege-muted hover:text-white' : 'border-siege-accent text-siege-accent'}`}
        >
          {showExtra ? 'View K/D + Rounds' : 'View HS% + ESR'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-siege-border">
        <div className="pb-4 lg:pb-0 lg:pr-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">Attack</span>
            <span className="text-siege-muted text-xs ml-auto">{atk.filter(o=>!o.smallSample).length} ops</span>
          </div>
          <OpSideList ops={atk} maxRounds={maxAtk} showExtra={showExtra} />
        </div>
        <div className="pt-4 lg:pt-0 lg:pl-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Defense</span>
            <span className="text-siege-muted text-xs ml-auto">{def.filter(o=>!o.smallSample).length} ops</span>
          </div>
          <OpSideList ops={def} maxRounds={maxDef} showExtra={showExtra} />
        </div>
      </div>
    </div>
  )
}

// ─── Career History ────────────────────────────────────────────────────────────

// Seasons with fewer than this many matches are filtered from the table
const MIN_CAREER_MATCHES = 5

function CareerRow({ entry, expanded, onToggle, seasonDetail, loading }) {
  const risVal = entry.ris ?? seasonDetail?.ris
  const kdaVal = entry.kda ?? seasonDetail?.kda
  const esrVal = entry.esr ?? seasonDetail?.esr
  const hsVal  = entry.hs  ?? seasonDetail?.hs

  return (
    <>
      <tr
        className={`border-b border-siege-border/40 cursor-pointer hover:bg-white/[0.03] transition-colors ${expanded ? 'bg-white/[0.03]' : ''}`}
        onClick={onToggle}
      >
        <td className="py-2 px-3 text-sm font-medium text-white">{entry.season}</td>
        <td className="py-2 px-3 text-xs text-siege-muted text-right">{entry.matches ?? '—'}</td>
        <td className={`py-2 px-3 text-sm font-semibold tabular-nums text-right ${kdColor(entry.kd)}`}>{entry.kd ?? '—'}</td>
        <td className={`py-2 px-3 text-sm text-right tabular-nums ${entry.wr != null ? wrColor(entry.wr) : 'text-siege-muted'}`}>
          {entry.wr != null ? `${entry.wr}%` : '—'}
        </td>
        <td className="py-2 px-3 text-xs text-right tabular-nums text-siege-muted">{entry.maxRp ?? entry.rp ?? '—'}</td>
        <td className={`py-2 px-3 text-xs text-right tabular-nums ${risVal ? risTextColor(risVal) : 'text-siege-muted'}`}>
          {risVal ?? '—'}
        </td>
        <td className="py-2 px-3 text-right">
          <span className="text-siege-muted text-xs">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-siege-border/40 bg-black/20">
          <td colSpan={7} className="px-3 pb-4 pt-2">
            {loading ? (
              <p className="text-siege-muted text-xs py-2">Loading season data…</p>
            ) : seasonDetail?.empty ? (
              <p className="text-siege-muted text-xs py-2">No ranked operator data available for {entry.season}.</p>
            ) : seasonDetail ? (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {kdaVal != null && <StatBox label="KDA"      value={String(kdaVal)}  accent={kdColor(kdaVal)} small />}
                  {hsVal  != null && <StatBox label="HS%"      value={`${hsVal}%`}     accent={hsColor(hsVal)} small />}
                  {esrVal != null && <StatBox label="ESR"      value={String(esrVal)}  accent={esrColor(esrVal)} tip={GLOSSARY.ESR} small />}
                  {(seasonDetail.clutches > 0) && <StatBox label="Clutches" value={String(seasonDetail.clutches)} small />}
                  {risVal != null && <StatBox label="RIS"      value={String(risVal)}  accent={risTextColor(risVal)} tip={GLOSSARY.RIS} small />}
                </div>
                <OpsTable operators={seasonDetail.operators} />
              </div>
            ) : (
              <p className="text-siege-muted text-xs py-2">Season data not yet available — check back after the next update.</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function CareerHistory({ careerHistory, tracker }) {
  const [expanded, setExpanded] = useState(null)
  const [cache, setCache]       = useState({})
  const [loading, setLoading]   = useState(false)

  const toggle = useCallback(async (season) => {
    if (expanded === season) { setExpanded(null); return }
    setExpanded(season)
    if (cache[season] !== undefined) return
    setLoading(true)
    try {
      const r    = await fetch(`/api/season?tracker=${encodeURIComponent(tracker)}&season=${season}`)
      const data = r.ok ? await r.json() : null
      setCache(c => ({ ...c, [season]: data }))
    } catch {
      setCache(c => ({ ...c, [season]: null }))
    } finally {
      setLoading(false)
    }
  }, [expanded, cache, tracker])

  // Filter out noise seasons (< 5 matches)
  const ranked = careerHistory.filter(e => e.matches >= MIN_CAREER_MATCHES)
  if (ranked.length === 0) return <p className="text-siege-muted text-sm">No career history available.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-siege-border text-left">
            {['Season', 'M', 'K/D', 'Win%', 'Pk RP', 'RIS', ''].map(h => (
              <th key={h} className="py-2 px-3 text-xs text-siege-muted font-medium uppercase tracking-wide text-right first:text-left last:w-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map(entry => (
            <CareerRow
              key={entry.season}
              entry={entry}
              expanded={expanded === entry.season}
              onToggle={() => toggle(entry.season)}
              seasonDetail={cache[entry.season]}
              loading={loading && expanded === entry.season && cache[entry.season] === undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function PlayerDetail() {
  const playersData = use(playersPromise)
  const { name }    = useParams()
  const all         = [...playersData.mainStack, ...(playersData.bTeam || []), ...(playersData.other || [])]
  const player      = all.find(p => p.name.toLowerCase() === name.toLowerCase())

  if (!player) {
    return <NotFound icon="👤" title="Player not found" message={`"${name}" doesn't exist in the roster.`} backTo="/players" backLabel="Back to Roster" />
  }

  const { stats = {}, operators, tracker, _updatedAt } = player

  const updatedLabel = _updatedAt
    ? new Date(_updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  const clutchWrVal = stats.clutchWR ? `${parseFloat(stats.clutchWR).toFixed(1)}%` : null
  const hsVal       = stats.hs       ? `${parseFloat(stats.hs).toFixed(1)}%`       : null

  // Pre-populate current season's computed stats into the first career history entry
  // so RIS/KDA/ESR show immediately without needing to expand
  const rawHistory   = player.careerHistory ?? []
  const careerHistory = rawHistory.map((entry, i) => {
    if (i !== 0) return entry
    return {
      ...entry,
      ...(stats.ris      && { ris:  parseFloat(stats.ris) }),
      ...(stats.kda      && { kda:  parseFloat(stats.kda) }),
      ...(stats.esr      && { esr:  parseFloat(stats.esr) }),
      ...(stats.hs       && { hs:   parseFloat(stats.hs) }),
    }
  })

  // Row 3: only include stats that exist
  const row3 = [
    stats.maxRp && stats.maxRp !== stats.rp ? { label: 'Peak RP', value: stats.maxRp } : null,
    stats.level ? { label: 'Level',   value: stats.level } : null,
    stats.aces  ? { label: 'Aces',    value: stats.aces  } : null,
  ].filter(Boolean)

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Breadcrumb */}
      <Link to="/players" className="text-siege-muted hover:text-siege-accent text-sm">← Players</Link>

      {/* Header */}
      <div className="card flex items-start gap-5 flex-wrap">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <PlayerAvatar name={player.name} size="lg" />
          {(player._topAtkOps?.length > 0 || player._topDefOps?.length > 0) && (
            <div className="flex gap-1">
              {[...(player._topAtkOps || []), ...(player._topDefOps || [])].map(n => (
                <PortraitChip key={n} name={n} size="w-6 h-6" />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{player.name}</h1>
            {stats.rank && (
              <span className="text-xs font-semibold text-siege-accent border border-siege-accent/30 px-2 py-0.5 rounded">
                {stats.rank}
              </span>
            )}
            {tracker && (
              <a
                href={`https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(tracker)}/overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-siege-muted hover:text-siege-accent border border-siege-border hover:border-siege-accent rounded px-2 py-0.5 transition-colors"
              >
                r6.tracker ↗
              </a>
            )}
          </div>
          {player.role && <p className="text-siege-muted text-sm mt-1">{player.role}</p>}
          {player.bio  && <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-xl">{player.bio}</p>}
          {updatedLabel
            ? <p className="text-siege-muted text-xs mt-2">Live · updated {updatedLabel}</p>
            : <p className="text-yellow-400/70 text-xs mt-2">Not in the live feed — stats are a manual snapshot.</p>}
        </div>
      </div>

      {/* Primary stats */}
      <div className="card space-y-2">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">Current Season</h3>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          <StatBox label="K/D"     value={stats.kd}      accent={kdColor(stats.kd)}                  tip={GLOSSARY.KD} />
          <StatBox label="Win%"    value={stats.winRate}  accent={wrColor(parseFloat(stats.winRate))} tip={GLOSSARY.WR} />
          <StatBox label="Matches" value={stats.matches}  tip={GLOSSARY.MATCHES} />
          <StatBox label="RP"      value={stats.rp} />
          <StatBox label="RIS"     value={stats.ris}      accent={risTextColor(stats.ris)}             tip={GLOSSARY.RIS} />
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          <StatBox label="KDA"       value={stats.kda}      accent={kdColor(stats.kda)} />
          <StatBox label="HS%"       value={hsVal}          accent={hsColor(stats.hs)} />
          <StatBox label="ESR"       value={stats.esr}      accent={esrColor(stats.esr)} tip={GLOSSARY.ESR} />
          <StatBox label="Clutches"  value={stats.clutches} />
          <StatBox label="Clutch W%" value={clutchWrVal}    accent={clutchWrColor(stats.clutchWR)} />
        </div>
        {row3.length > 0 && (
          <div className={`grid gap-1 sm:gap-2`} style={{ gridTemplateColumns: `repeat(${row3.length}, minmax(0, 1fr))` }}>
            {row3.map(({ label, value }) => (
              <StatBox key={label} label={label} value={value} small />
            ))}
          </div>
        )}
      </div>

      {/* Operator breakdown */}
      <div className="card">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-4">Operators — Current Season</h3>
        <OpsTable operators={operators} />
      </div>

      {/* Career history */}
      <div className="card">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-4">Career History</h3>
        <CareerHistory careerHistory={careerHistory} tracker={tracker} />
      </div>

    </div>
  )
}
