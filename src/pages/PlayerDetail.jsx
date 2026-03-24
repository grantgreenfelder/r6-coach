import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import playersData from '../data/players.json'

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
  // Try without bold end marker
  const re2 = new RegExp(`\\*\\*${field}:\\*\\*\\s*([^\\n]+)`, 'i')
  const m2 = text.match(re2)
  return m2 ? m2[1].replace(/\*\*/g, '').trim() : ''
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, accent }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className={`text-xl font-bold leading-none ${accent || 'text-white'}`}>{value || '—'}</div>
      <div className="text-siege-muted text-xs mt-1">{label}</div>
    </div>
  )
}

function OpsRow({ atk, def }) {
  if (!atk && !def) return null
  return (
    <div className="flex gap-6 text-sm">
      {atk && (
        <div>
          <span className="text-siege-muted text-xs uppercase tracking-wider block mb-1">Attack</span>
          <span className="text-white font-medium">{atk}</span>
        </div>
      )}
      {def && (
        <div>
          <span className="text-siege-muted text-xs uppercase tracking-wider block mb-1">Defense</span>
          <span className="text-white font-medium">{def}</span>
        </div>
      )}
    </div>
  )
}

function MapMiniTable({ maps, limit = 8 }) {
  if (!maps || maps.length === 0) return <p className="text-siege-muted text-sm">No map data</p>

  const sorted = [...maps]
    .sort((a, b) => b.matches - a.matches)
    .slice(0, limit)

  return (
    <div className="space-y-1.5">
      {sorted.map(m => {
        const wr = m.winRate
        const color = wr >= 55 ? 'text-siege-green' : wr >= 45 ? 'text-blue-300' : wr >= 35 ? 'text-yellow-400' : 'text-siege-red'
        const barColor = wr >= 55 ? 'bg-siege-green' : wr >= 45 ? 'bg-blue-400' : wr >= 35 ? 'bg-yellow-500' : 'bg-siege-red'
        return (
          <div key={m.map} className="flex items-center gap-2">
            <span className="text-siege-muted text-xs w-32 truncate flex-shrink-0">{m.map}</span>
            <div className="flex-1 h-1.5 bg-siege-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(wr, 100)}%` }} />
            </div>
            <span className={`text-xs font-semibold w-10 text-right flex-shrink-0 ${color}`}>{wr}%</span>
            <span className="text-siege-muted text-xs w-8 text-right flex-shrink-0">{m.matches}M</span>
          </div>
        )
      })}
    </div>
  )
}

function BulletList({ items, color = 'text-gray-300' }) {
  if (!items || items.length === 0) return <p className="text-siege-muted text-sm">No notes</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 text-sm ${color}`}>
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
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-300">
          <span className="text-siege-accent font-bold flex-shrink-0 w-5">{i + 1}.</span>
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

  const strengths = extractIdentityField(identitySection, 'Strengths?')
  const tendencies = extractIdentityField(identitySection, 'Tendencies')
  const roleFit = extractIdentityField(identitySection, 'Role fit')
  const soloGroup = extractIdentityField(identitySection, 'Solo vs\\. Group')

  const careerNotes = extractBullets(careerSection)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Identity */}
      <div className="card space-y-4">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">Identity</h3>
        {strengths && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">Strengths</p>
            <p className="text-gray-300 text-sm leading-relaxed">{strengths}</p>
          </div>
        )}
        {tendencies && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">Tendencies</p>
            <p className="text-gray-300 text-sm leading-relaxed">{tendencies}</p>
          </div>
        )}
        {roleFit && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">Role Fit</p>
            <p className="text-gray-300 text-sm leading-relaxed">{roleFit}</p>
          </div>
        )}
        {soloGroup && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-1">Solo / Group</p>
            <p className="text-gray-300 text-sm leading-relaxed">{soloGroup}</p>
          </div>
        )}
      </div>

      {/* Career Coaching Notes */}
      <div className="card">
        <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-4">Career Notes</h3>
        <BulletList items={careerNotes} />
      </div>
    </div>
  )
}

function SeasonTab({ label, stats, atkOps, defOps, mapPerformance, notes, priorities }) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        <StatBox label="Rank" value={stats?.rank} />
        <StatBox label="K/D" value={stats?.kd} accent="text-white" />
        <StatBox label="Win%" value={stats?.winRate} accent={
          parseFloat(stats?.winRate) >= 50 ? 'text-siege-green' :
          parseFloat(stats?.winRate) >= 40 ? 'text-yellow-400' : 'text-siege-red'
        } />
        <StatBox label="Matches" value={stats?.matches} />
        <StatBox label="RIS" value={stats?.ris} accent="text-siege-accent" />
      </div>

      {/* Ops + Map performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider">Operators</h3>
          <OpsRow atk={atkOps} def={defOps} />
        </div>

        <div className="card">
          <h3 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-3">Map Performance</h3>
          <MapMiniTable maps={mapPerformance} />
        </div>
      </div>

      {/* Notes */}
      {(notes?.length > 0 || priorities?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      )}
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
    alltime: 'All Time',
    [player?.prevSeason]: player?.prevSeason || 'Prev Season',
    [player?.season]: player?.season || 'Current',
  }

  const [activeTab, setActiveTab] = useState(player?.season || 'Y11S1')

  if (!player) {
    return (
      <div className="p-8 text-center">
        <p className="text-siege-muted text-lg">Player not found: {name}</p>
        <Link to="/players" className="text-siege-accent hover:underline mt-4 inline-block">← Back to Players</Link>
      </div>
    )
  }

  // Parse season notes from seasonContent "## Season Coaching Notes"
  const y11s1Notes = extractBullets(extractSection(player.seasonContent, 'Season Coaching Notes'))
  const y10s4Notes = extractBullets(extractSection(player.prevSeasonContent, 'Season Coaching Notes'))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Breadcrumb */}
      <Link to="/players" className="text-siege-muted hover:text-siege-accent text-sm">← Players</Link>

      {/* Header card */}
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
      {activeTab === 'alltime' && (
        <AllTimeTab player={player} />
      )}

      {activeTab === player.prevSeason && player.prevSeasonStats && (
        <SeasonTab
          label={player.prevSeason}
          stats={player.prevSeasonStats}
          atkOps={player.prevSeasonAtkOps}
          defOps={player.prevSeasonDefOps}
          mapPerformance={player.prevSeasonMapPerformance}
          notes={y10s4Notes}
          priorities={[]}
        />
      )}

      {activeTab === player.prevSeason && !player.prevSeasonStats && (
        <div className="card text-siege-muted text-sm text-center py-8">No {player.prevSeason} data available.</div>
      )}

      {activeTab === player.season && (
        <SeasonTab
          label={player.season}
          stats={player.stats}
          atkOps={player.atkOps}
          defOps={player.defOps}
          mapPerformance={player.mapPerformance}
          notes={y11s1Notes}
          priorities={player.coachingPriorities}
        />
      )}

    </div>
  )
}
