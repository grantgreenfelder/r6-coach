import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import playersData from '../data/players.json'
import { opWrColor, opWrBgColor, wrColor, wrBgColor, kdColor, risTextColor } from '../utils/constants'
import { NotFound } from '../components/EmptyState'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'

// ─── Markdown helpers ──────────────────────────────────────────────────────────

function extractSection(content, heading) {
  if (!content) return ''
  const lines = content.split('\n')
  const re = new RegExp(`^#{1,3}\\s+${heading}`, 'i')
  const start = lines.findIndex(l => re.test(l))
  if (start === -1) return ''
  const level = (lines[start].match(/^(#+)/) || ['', '#'])[1].length
  const endRe = new RegExp(`^#{1,${level}}\\s`)
  const end = lines.findIndex((l, i) => i > start && endRe.test(l))
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim()
}

function extractBullets(text) {
  return text.split('\n')
    .filter(l => /^\s*[-*]\s/.test(l))
    .map(l => l.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
}

function extractIdentityField(text, field) {
  const re = new RegExp(`\\*\\*${field}[:\\s]+\\*\\*\\s*([^\\n]+)`, 'i')
  const m = text.match(re)
  if (m) return m[1].replace(/\*\*/g, '').trim()
  const re2 = new RegExp(`\\*\\*${field}:\\*\\*\\s*([^\\n]+)`, 'i')
  const m2 = text.match(re2)
  return m2 ? m2[1].replace(/\*\*/g, '').trim() : ''
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, accent, tip }) {
  return (
    <div className="bg-black/30 border border-siege-border rounded-lg p-2 sm:p-3 text-center">
      <div className={`text-sm sm:text-xl font-bold leading-none truncate ${accent || 'text-white'}`}>{value || '—'}</div>
      <div className="text-siege-muted text-[10px] sm:text-xs mt-1 sm:mt-1.5 uppercase tracking-wider flex items-center justify-center gap-1">
        {label}{tip && <HelpTip text={tip} />}
      </div>
    </div>
  )
}

// ─── Operator Table ────────────────────────────────────────────────────────────

const FLAG_LABEL = { '⭐': 'standout', '✅': 'solid', '⚠️': 'low sample' }

function OpRow({ op, maxRounds }) {
  const wr = op.winRate
  const wrCls = opWrColor(wr)
  const barColor = opWrBgColor(wr)
  const roundsPct = maxRounds > 0 ? Math.min((op.rounds / maxRounds) * 100, 100) : 0
  const kdCls = kdColor(op.kd)

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-siege-border/40 last:border-0">
      {/* Op name + flag */}
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0 min-w-0">
        <span className="text-white text-sm font-medium truncate">{op.name}</span>
        {op.flag && (
          <span title={FLAG_LABEL[op.flag] || op.flag} className="text-xs leading-none flex-shrink-0">{op.flag}</span>
        )}
      </div>

      {/* Rounds bar (volume indicator) */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="h-1 bg-siege-border rounded-full overflow-hidden">
          <div className="h-full bg-siege-muted/50 rounded-full" style={{ width: `${roundsPct}%` }} />
        </div>
        {/* Win% bar */}
        <div className="h-1.5 bg-siege-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(wr, 100)}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="text-right">
          <span className={`text-sm font-semibold tabular-nums ${wrCls}`}>{wr}%</span>
          <span className="text-siege-muted text-xs ml-1 hidden sm:inline">WR</span>
        </div>
        <div className="text-right w-9 sm:w-10">
          <span className={`text-sm tabular-nums ${kdCls}`}>{op.kd}</span>
          <span className="text-siege-muted text-xs ml-0.5 hidden sm:inline">K/D</span>
        </div>
        <div className="text-right w-7 sm:w-8 hidden sm:block">
          <span className="text-siege-muted text-xs tabular-nums">{op.rounds}r</span>
        </div>
      </div>
    </div>
  )
}

function OpsTable({ operators }) {
  const atk = operators?.atk || []
  const def = operators?.def || []
  const maxAtkRounds = Math.max(...atk.map(o => o.rounds), 1)
  const maxDefRounds = Math.max(...def.map(o => o.rounds), 1)

  if (atk.length === 0 && def.length === 0) {
    return <p className="text-siege-muted text-sm">No operator data</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-siege-border">
      {/* Attack */}
      <div className="pb-4 lg:pb-0 lg:pr-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">Attack</span>
          <span className="text-siege-muted text-xs ml-auto">{atk.length} operators</span>
        </div>
        {atk.length > 0 ? atk.map(op => (
          <OpRow key={op.name} op={op} maxRounds={maxAtkRounds} />
        )) : <p className="text-siege-muted text-sm">No ATK data</p>}
      </div>

      {/* Defense */}
      <div className="pt-4 lg:pt-0 lg:pl-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Defense</span>
          <span className="text-siege-muted text-xs ml-auto">{def.length} operators</span>
        </div>
        {def.length > 0 ? def.map(op => (
          <OpRow key={op.name} op={op} maxRounds={maxDefRounds} />
        )) : <p className="text-siege-muted text-sm">No DEF data</p>}
      </div>
    </div>
  )
}

// ─── Map Performance ───────────────────────────────────────────────────────────

function MapMiniTable({ maps }) {
  if (!maps || maps.length === 0) return <p className="text-siege-muted text-sm">No map data</p>

  const sorted = [...maps].sort((a, b) => b.matches - a.matches)

  return (
    <div className="space-y-2">
      {sorted.map(m => {
        const wr = m.winRate
        const color = wrColor(wr)
        const barColor = wrBgColor(wr)
        return (
          <div key={m.map} className="flex items-center gap-2">
            <span className="text-siege-muted text-xs w-32 truncate flex-shrink-0">{m.map}</span>
            <div className="flex-1 h-1.5 bg-siege-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(wr, 100)}%` }} />
            </div>
            <span className={`text-xs font-semibold w-10 text-right flex-shrink-0 tabular-nums ${color}`}>{wr}%</span>
            <span className="text-siege-muted text-xs w-6 text-right flex-shrink-0 tabular-nums">{m.matches}M</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Misc list components ──────────────────────────────────────────────────────

function BulletList({ items }) {
  if (!items || items.length === 0) return <p className="text-siege-muted text-sm">No notes</p>
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-300">
          <span className="text-siege-accent flex-shrink-0 mt-0.5">•</span>
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PriorityList({ items }) {
  if (!items || items.length === 0) return <p className="text-siege-muted text-sm">No priorities</p>
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-300">
          <span className="text-siege-accent font-bold flex-shrink-0 w-5 tabular-nums">{i + 1}.</span>
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ol>
  )
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function AllTimeTab({ player }) {
  const identitySection = extractSection(player.profileContent, 'Identity')
  const careerSection = extractSection(player.profileContent, 'Career Coaching Notes')

  const strengths  = extractIdentityField(identitySection, 'Strengths?')
  const tendencies = extractIdentityField(identitySection, 'Tendencies')
  const roleFit    = extractIdentityField(identitySection, 'Role fit')
  const soloGroup  = extractIdentityField(identitySection, 'Solo vs\\. Group')

  const careerNotes = extractBullets(careerSection)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-5">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">Identity</h3>
        {[
          { label: 'Strengths', value: strengths },
          { label: 'Tendencies', value: tendencies },
          { label: 'Role Fit', value: roleFit },
          { label: 'Solo / Group', value: soloGroup },
        ].filter(f => f.value).map(f => (
          <div key={f.label}>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">{f.label}</p>
            <p className="text-gray-300 text-sm leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-4">Career Notes</h3>
        <BulletList items={careerNotes} />
      </div>
    </div>
  )
}

function SeasonTab({ stats, operators, mapPerformance, notes, priorities }) {
  const wrNum = parseFloat(stats?.winRate)
  const wrAccent = wrNum >= 50 ? 'text-siege-green' : wrNum >= 40 ? 'text-yellow-400' : 'text-siege-red'
  const risNum = parseFloat(stats?.ris)
  const risAccent = risTextColor(risNum)

  return (
    <div className="space-y-4">

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        <StatBox label="Rank"    value={stats?.rank} />
        <StatBox label="K/D"     value={stats?.kd}       tip={GLOSSARY.KD} />
        <StatBox label="Win%"    value={stats?.winRate}  tip={GLOSSARY.WR}  accent={wrAccent} />
        <StatBox label="Matches" value={stats?.matches}  tip={GLOSSARY.MATCHES} />
        <StatBox label="RIS"     value={stats?.ris}      tip={GLOSSARY.RIS} accent={risAccent} />
      </div>

      {/* Operators — full width card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">Operators</h3>
          <span className="text-siege-muted text-xs ml-1">— Win% bar · K/D · Rounds played (volume bar)</span>
        </div>
        <OpsTable operators={operators} />
      </div>

      {/* Map performance + Notes/Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-3">Map Performance</h3>
          <MapMiniTable maps={mapPerformance} />
        </div>

        <div className="space-y-4">
          {notes?.length > 0 && (
            <div className="card">
              <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-3">Season Notes</h3>
              <BulletList items={notes} />
            </div>
          )}
          {priorities?.length > 0 && (
            <div className="card">
              <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-3">Focus Areas</h3>
              <PriorityList items={priorities} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function PlayerDetail() {
  const { name } = useParams()
  const all = [...playersData.mainStack, ...playersData.bTeam, ...playersData.other]
  const player = all.find(p => p.name.toLowerCase() === name.toLowerCase())

  const tabs = [
    'alltime',
    ...(player?.prevSeason ? [player.prevSeason] : []),
    player?.season || 'Y11S1',
  ]
  const tabLabels = {
    alltime: 'Profile',
    [player?.prevSeason]: player?.prevSeason || 'Prev Season',
    [player?.season]: player?.season || 'Current',
  }

  const [activeTab, setActiveTab] = useState(player?.season || 'Y11S1')

  if (!player) {
    return <NotFound icon="👤" title={`Player not found`} message={`"${name}" doesn't exist in the roster.`} backTo="/players" backLabel="Back to Roster" />
  }

  const y11s1Notes = extractBullets(extractSection(player.seasonContent, 'Season Coaching Notes'))
  const y10s4Notes = extractBullets(extractSection(player.prevSeasonContent, 'Season Coaching Notes'))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Breadcrumb */}
      <Link to="/players" className="text-siege-muted hover:text-siege-accent text-sm">← Players</Link>

      {/* Header */}
      <div className="card flex items-start gap-5 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-siege-accent flex items-center justify-center text-xl font-bold text-siege-bg flex-shrink-0">
          {player.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{player.name}</h1>
            {player.tracker && (
              <a
                href={`https://r6.tracker.network/r6siege/profile/ubi/${player.tracker}/overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-siege-muted hover:text-siege-accent border border-siege-border rounded px-2 py-0.5"
              >
                r6.tracker ↗
              </a>
            )}
          </div>
          {player.role && <p className="text-siege-muted text-sm mt-1">{player.role}</p>}
          {player.bio && <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-xl">{player.bio}</p>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-siege-border">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-siege-accent text-siege-accent'
                : 'border-transparent text-siege-muted hover:text-white'
            }`}
          >
            {tabLabels[tab] || tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'alltime' && <AllTimeTab player={player} />}

      {activeTab === player.prevSeason && player.prevSeasonStats && (
        <SeasonTab
          stats={player.prevSeasonStats}
          operators={player.prevSeasonOperators}
          mapPerformance={player.prevSeasonMapPerformance}
          notes={y10s4Notes}
          priorities={player.prevSeasonPriorities || []}
        />
      )}

      {activeTab === player.prevSeason && !player.prevSeasonStats && (
        <div className="card text-siege-muted text-sm text-center py-8">
          No {player.prevSeason} data available.
        </div>
      )}

      {activeTab === player.season && (
        <SeasonTab
          stats={player.stats}
          operators={player.operators}
          mapPerformance={player.mapPerformance}
          notes={y11s1Notes}
          priorities={player.coachingPriorities}
        />
      )}

    </div>
  )
}
