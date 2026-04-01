import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import operatorsData from '../data/operators.json'
import playersData from '../data/players.json'
import { opWrColor, opWrBgColor, kdColor } from '../utils/constants'
import { getPortraitUrl } from '../utils/operatorPortraits'
import { NotFound } from '../components/EmptyState'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDE_COLORS = {
  ATK: { text: 'text-orange-400', badge: 'border-orange-400/40 text-orange-400 bg-orange-400/10' },
  DEF: { text: 'text-blue-400',   badge: 'border-blue-400/40 text-blue-400 bg-blue-400/10' },
}

const SEASON_LABELS = { y11s1: 'Y11S1', y10s4: 'Y10S4' }

// ─── Small shared components ──────────────────────────────────────────────────

function BulletList({ items }) {
  if (!items?.length) return <p className="text-siege-muted text-sm">—</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-300">
          <span className="text-siege-accent flex-shrink-0 mt-0.5">•</span>
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function SectionCard({ title, children, accentLeft }) {
  return (
    <div className={`card space-y-3 ${accentLeft ? `border-l-2 ${accentLeft}` : ''}`}>
      <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

// ─── Wiki Tab ─────────────────────────────────────────────────────────────────

function LoadoutTable({ rows }) {
  if (!rows?.length) return <p className="text-siege-muted text-sm">—</p>
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-3 text-sm py-1 border-b border-siege-border/30 last:border-0">
          <span className="text-white font-medium w-32 flex-shrink-0">{r.weapon}</span>
          <span className="text-gray-400 text-xs mt-0.5 flex-1">{r.notes || r.type}</span>
        </div>
      ))}
    </div>
  )
}

function CoachingRec({ rec }) {
  const FIELD_LABELS = {
    primary: 'Primary',
    muzzle: 'Muzzle',
    grip: 'Grip',
    scope: 'Scope',
    laser: 'Laser',
    secondary: 'Secondary',
    'secondary gadget': 'Sec. Gadget',
  }
  const entries = Object.entries(rec).filter(([k]) => k !== 'rationale' && FIELD_LABELS[k])
  if (!entries.length && !rec.rationale) return <p className="text-siege-muted text-sm">No recommendation available</p>

  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {entries.map(([field, val]) => (
            <div key={field} className="bg-black/30 rounded p-2">
              <div className="text-siege-muted text-[10px] uppercase tracking-wider mb-0.5">{FIELD_LABELS[field] || field}</div>
              <div className="text-white text-sm font-medium">{val}</div>
            </div>
          ))}
        </div>
      )}
      {rec.rationale && (
        <p className="text-gray-400 text-xs leading-relaxed italic">{rec.rationale}</p>
      )}
    </div>
  )
}

function WikiTab({ op }) {
  return (
    <div className="space-y-4">
      {/* Gadget */}
      <SectionCard title={`Gadget — ${op.gadget.name || 'Unknown'}`}>
        {op.gadget.description && (
          <p className="text-gray-300 text-sm leading-relaxed">{op.gadget.description}</p>
        )}
        {op.gadget.mechanics?.length > 0 && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-2">Key Mechanics</p>
            <BulletList items={op.gadget.mechanics} />
          </div>
        )}
        {op.gadget.tips?.length > 0 && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-2">Usage Tips</p>
            <BulletList items={op.gadget.tips} />
          </div>
        )}
      </SectionCard>

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Strengths" accentLeft="border-siege-green">
          <BulletList items={op.strengths} />
        </SectionCard>
        <SectionCard title="Weaknesses" accentLeft="border-siege-red">
          <BulletList items={op.weaknesses} />
        </SectionCard>
      </div>

      {/* Playstyle */}
      {op.playstyle && (
        <SectionCard title="Playstyle">
          <p className="text-gray-300 text-sm leading-relaxed">{op.playstyle}</p>
        </SectionCard>
      )}

      {/* Loadout */}
      <SectionCard title="Loadout">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-2">Primaries</p>
            <LoadoutTable rows={op.loadout.primaries} />
          </div>
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-2">Secondaries</p>
            <LoadoutTable rows={op.loadout.secondaries} />
            {op.loadout.secondaryGadgets?.length > 0 && (
              <div className="mt-3">
                <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">Secondary Gadgets</p>
                <div className="flex flex-wrap gap-1.5">
                  {op.loadout.secondaryGadgets.map((g, i) => (
                    <span key={i} className="bg-siege-border/50 text-gray-300 text-xs rounded px-2 py-0.5">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {op.loadout.coachingRec && Object.keys(op.loadout.coachingRec).length > 0 && (
          <div className="mt-4 pt-4 border-t border-siege-border">
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-3">Coaching Recommendation</p>
            <CoachingRec rec={op.loadout.coachingRec} />
          </div>
        )}
      </SectionCard>

      {/* Stack Notes */}
      {op.stackNotes && (
        <SectionCard title="Stack Coaching Notes">
          <p className="text-gray-300 text-sm leading-relaxed">{op.stackNotes}</p>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

const _mainNames = (playersData.mainStack || []).map(p => p.name)
const _bTeamNames = (playersData.bTeam || []).map(p => p.name)
const PLAYER_ORDER = [..._mainNames, ..._bTeamNames]
const MAIN_STACK = new Set(_mainNames)

function PlayerStatRow({ entry, maxRounds }) {
  const wr = entry.winRate
  const wrColor = opWrColor(wr)
  const barColor = opWrBgColor(wr)
  const kdCls = kdColor(entry.kd)
  const volumePct = maxRounds > 0 ? Math.min((entry.rounds / maxRounds) * 100, 100) : 0
  const isMain = MAIN_STACK.has(entry.player)

  return (
    <div className="flex items-center gap-3 py-2 border-b border-siege-border/30 last:border-0">
      {/* Player */}
      <div className="flex items-center gap-2 w-20 flex-shrink-0">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
          ${isMain ? 'bg-siege-accent/20 text-siege-accent' : 'bg-siege-border text-gray-400'}`}>
          {entry.player[0]}
        </div>
        <span className={`text-sm truncate ${isMain ? 'text-white' : 'text-gray-400'}`}>{entry.player}</span>
      </div>

      {/* Volume + WR bars */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="h-1 bg-siege-border rounded-full overflow-hidden">
          <div className="h-full bg-siege-muted/40 rounded-full" style={{ width: `${volumePct}%` }} />
        </div>
        <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(wr, 100)}%` }} />
        </div>
      </div>

      {/* Numbers */}
      <div className="flex items-center gap-3 flex-shrink-0 text-right">
        <div>
          <span className={`text-sm font-semibold tabular-nums ${wrColor}`}>{wr}%</span>
          <span className="text-siege-muted text-xs ml-1 hidden sm:inline">WR</span>
        </div>
        <div className="w-10">
          <span className={`text-sm tabular-nums ${kdCls}`}>{entry.kd}</span>
          <span className="text-siege-muted text-xs ml-0.5 hidden sm:inline">K/D</span>
        </div>
        <div className="w-8 hidden sm:block">
          <span className="text-siege-muted text-xs tabular-nums">{entry.rounds}r</span>
        </div>
      </div>
    </div>
  )
}

function StatsTab({ op }) {
  const seasons = Object.entries(SEASON_LABELS)
    .filter(([k]) => op.stats?.[k]?.length > 0)
    .map(([k, v]) => ({ key: k, label: v }))

  const [activeSeason, setActiveSeason] = useState(seasons[0]?.key || 'y11s1')
  const [showAll, setShowAll] = useState(false)

  if (seasons.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-siege-muted">No tracked data for {op.name.replace(/_/g, ' ')} yet.</p>
        <p className="text-siege-muted text-xs mt-2">Stats appear here once players log rounds on this operator.</p>
      </div>
    )
  }

  const rawRows = op.stats[activeSeason] || []
  // Sort by rounds descending, maintain player order as tiebreaker
  const sorted = [...rawRows].sort((a, b) => {
    const roundsDiff = b.rounds - a.rounds
    if (roundsDiff !== 0) return roundsDiff
    return (PLAYER_ORDER.indexOf(a.player) + 99) - (PLAYER_ORDER.indexOf(b.player) + 99)
  })
  const displayed = showAll ? sorted : sorted.filter(e => MAIN_STACK.has(e.player) || e.rounds >= 5)
  const maxRounds = sorted[0]?.rounds || 1

  // Aggregate totals
  const total = sorted.reduce((acc, e) => ({
    rounds: acc.rounds + e.rounds,
    wrSum: acc.wrSum + e.winRate * e.rounds,
    kdSum: acc.kdSum + e.kd * e.rounds,
  }), { rounds: 0, wrSum: 0, kdSum: 0 })
  const avgWr = total.rounds > 0 ? (total.wrSum / total.rounds).toFixed(1) : '—'
  const avgKd = total.rounds > 0 ? (total.kdSum / total.rounds).toFixed(2) : '—'

  return (
    <div className="space-y-4">
      {/* Season selector */}
      <div className="flex gap-1 border-b border-siege-border">
        {seasons.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSeason(s.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeSeason === s.key
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Rounds', value: total.rounds || '—', tip: null },
          { label: 'Avg WR',       value: total.rounds ? `${avgWr}%` : '—', tip: GLOSSARY.WR },
          { label: 'Avg K/D',      value: avgKd, tip: GLOSSARY.KD },
        ].map(s => (
          <div key={s.label} className="bg-black/30 border border-siege-border rounded-lg p-2 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold text-white leading-none">{s.value}</div>
            <div className="text-siege-muted text-[10px] sm:text-xs mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
              {s.label}{s.tip && <HelpTip text={s.tip} />}
            </div>
          </div>
        ))}
      </div>

      {/* Player rows */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-siege-muted text-xs flex-1 flex items-center gap-1.5">
            Win% bar <HelpTip text={GLOSSARY.WR} /> · K/D <HelpTip text={GLOSSARY.KD} /> · Rounds Played
          </p>
          {sorted.length > displayed.length && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-siege-accent hover:underline"
            >
              {showAll ? 'Show less' : `+${sorted.length - displayed.length} more`}
            </button>
          )}
        </div>
        {displayed.length > 0
          ? displayed.map((e, i) => <PlayerStatRow key={i} entry={e} maxRounds={maxRounds} />)
          : <p className="text-siege-muted text-sm py-4 text-center">No data for this season</p>
        }
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OperatorDetail() {
  const { name } = useParams()
  const allOps = [...operatorsData.atk, ...operatorsData.def]
  const op = allOps.find(o => o.name.toLowerCase() === name?.toLowerCase())

  const [activeTab, setActiveTab] = useState('wiki')
  const [imgError, setImgError] = useState(false)

  if (!op) {
    return <NotFound icon="⚔" title="Operator not found" message={`"${name}" doesn't exist in the operator list.`} backTo="/operators" backLabel="Back to Operators" />
  }

  const colors = SIDE_COLORS[op.side] || SIDE_COLORS.ATK

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <Link to="/operators" className="text-siege-muted hover:text-siege-accent text-sm">← Operators</Link>

      {/* Header card */}
      <div className="card flex items-start gap-5 flex-wrap">
        {/* Portrait */}
        <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0 ring-1 ring-siege-border">
          {!imgError ? (
            <img
              src={getPortraitUrl(op.name)}
              alt={op.name}
              loading="lazy"
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-4xl font-bold text-siege-accent/60">{op.name[0]}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-white">{op.name.replace(/_/g, ' ')}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors.badge}`}>
              {op.side}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border border-siege-border text-siege-muted">
              {op.category}
            </span>
          </div>

          {/* Profile fields */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {op.profile.realName && (
              <span className="text-gray-400 text-xs"><span className="text-siege-muted">Name</span> {op.profile.realName}</span>
            )}
            {op.profile.ctu && (
              <span className="text-gray-400 text-xs"><span className="text-siege-muted">CTU</span> {op.profile.ctu}</span>
            )}
            {op.profile.speedArmor && (
              <span className="text-gray-400 text-xs"><span className="text-siege-muted">Speed</span> {op.profile.speedArmor}</span>
            )}
            {op.profile.role && (
              <span className="text-gray-400 text-xs"><span className="text-siege-muted">Role</span> {op.profile.role}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-siege-border">
        {[
          { key: 'wiki', label: 'Wiki' },
          { key: 'stats', label: 'Stack Stats' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab context label */}
      {activeTab === 'stats' && (
        <p className="text-siege-muted text-xs -mt-4">
          Team performance data for {op.name.replace(/_/g, ' ')} across all tracked players and seasons.
        </p>
      )}

      {/* Tab content */}
      {activeTab === 'wiki'  && <WikiTab  op={op} />}
      {activeTab === 'stats' && <StatsTab op={op} />}
    </div>
  )
}
