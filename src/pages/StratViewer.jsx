import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import mapsData from '../data/maps.json'
import StatusDot from '../components/StatusDot'
import MarkdownContent from '../components/MarkdownContent'
import PlayerAvatar from '../components/PlayerAvatar.jsx'
import { NotFound } from '../components/EmptyState'

// ─── Content Parsers (run client-side from strat.content) ─────────────────────

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

function parseTable(text) {
  if (!text) return []
  const lines = text.split('\n').filter(l => l.includes('|') && !/^[\s|:-]+$/.test(l))
  if (lines.length < 2) return []
  const headers = lines[0].split('|').map(h => h.replace(/\*\*/g, '').trim()).filter(Boolean)
  return lines.slice(1).map(row => {
    const cells = row.split('|').map(c => c.replace(/\*\*/g, '').trim()).filter(Boolean)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cells[i] || '' })
    return obj
  }).filter(row => Object.values(row).some(v => v) && !/^player$/i.test(row[headers[0]]))
}

function parseStratContent(content) {
  if (!content) return {}

  // Player role descriptions: "**Player (Role)** — text"
  const playerDescriptions = {}
  const descRe = /\*\*(\w+)\s+\([^)]+\)\*\*\s+[—–-]\s+(.+)/g
  let dm
  while ((dm = descRe.exec(content)) !== null) {
    playerDescriptions[dm[1]] = dm[2].trim()
  }

  // Execute steps: "1. **Step name** — description"
  const execSection = extractSection(content, 'Execute Sequence')
  const executeSteps = []
  const stepRe = /^(\d+)\.\s+\*\*([^*]+)\*\*\s+[—–-]\s+(.+)/gm
  let sm
  while ((sm = stepRe.exec(execSection)) !== null) {
    executeSteps.push({ n: parseInt(sm[1]), label: sm[2].trim(), text: sm[3].trim() })
  }

  // Plant positions (ATK)
  const plantSection = extractSection(content, 'Plant Position')
  const primaryPlant   = plantSection.match(/\*\*Primary:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''
  const alternatePlant = plantSection.match(/\*\*Alternate:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''

  // Post-Plant / Post-Hold table
  const postPlantSection = extractSection(content, 'Post-Plant') || extractSection(content, 'Post-Hold')
  const postPlant = parseTable(postPlantSection)

  // Spawn
  const spawn = extractSection(content, 'Spawn')

  // Watch For / Counter Intel
  const watchSection = extractSection(content, 'Watch For') || extractSection(content, 'Counter Intel')
  const watchItems = watchSection.split('\n')
    .filter(l => /^\s*[-*]/.test(l))
    .map(l => {
      const raw = l.replace(/^\s*[-*]\s+/, '').trim()
      const tm = raw.match(/^\*\*([^*:]+)[*:]?\*\*[:\s]+(.+)/)
      return tm
        ? { title: tm[1].replace(/\*\*/g, '').trim(), text: tm[2].replace(/\*\*/g, '').trim() }
        : { title: '', text: raw.replace(/\*\*/g, '').trim() }
    })
    .filter(w => w.text)

  // Win Conditions
  const winSection = extractSection(content, 'Win Conditions')
  const winConditions = []
  if (winSection) {
    const blocks = winSection.split(/\n(?=###\s)/).filter(b => b.trim())
    for (const block of blocks) {
      const titleM = block.match(/^###\s+(.+)/)
      if (!titleM) continue
      const when    = block.match(/\*\*When:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''
      const callout = block.match(/\*\*Who calls it:\*\*\s*([^\n]+)/)?.[1]?.trim() || ''
      const desc = block.split('\n').slice(1)
        .filter(l => l.trim() && !/^\*\*When:/.test(l) && !/^\*\*Who calls it:/.test(l))
        .join(' ').replace(/\*\*/g, '').trim()
      winConditions.push({ title: titleM[1].trim(), when, description: desc, callout })
    }
  }

  return { playerDescriptions, executeSteps, primaryPlant, alternatePlant, postPlant, spawn, watchItems, winConditions }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanPlayer(raw) {
  return (raw || '').replace(/\*\*/g, '').trim()
}

// Highlight a player name inside a string — returns array of {text, highlight}
function highlight(text, playerName) {
  if (!playerName) return [{ text, hl: false }]
  const parts = text.split(new RegExp(`(${playerName})`, 'gi'))
  return parts.map((p, i) => ({ text: p, hl: i % 2 === 1 }))
}

function HighlightedText({ text, player }) {
  const parts = highlight(text, player)
  return (
    <>
      {parts.map((p, i) =>
        p.hl
          ? <span key={i} className="text-siege-accent font-semibold bg-siege-accent/10 rounded px-0.5">{p.text}</span>
          : <span key={i}>{p.text}</span>
      )}
    </>
  )
}

// Does text mention this player?
function mentionsPlayer(text, playerName) {
  if (!playerName) return true
  return new RegExp(playerName, 'i').test(text)
}

const SIDE_COLOR  = { ATK: 'text-orange-400', DEF: 'text-blue-400' }
const SIDE_BORDER = { ATK: 'border-orange-400/40', DEF: 'border-blue-400/40' }
const SIDE_BG     = { ATK: 'bg-orange-400/5', DEF: 'bg-blue-400/5' }
const SIDE_PILL   = { ATK: 'bg-orange-400/20 text-orange-300', DEF: 'bg-blue-400/20 text-blue-300' }

// ─── Section Components ───────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="text-siege-accent font-semibold text-xs uppercase tracking-wider mb-3">{children}</h2>
  )
}

function SpawnCard({ spawn }) {
  if (!spawn) return null
  return (
    <div className="card">
      <SectionHeading>Spawn</SectionHeading>
      <p className="text-gray-300 text-sm leading-relaxed">{spawn}</p>
    </div>
  )
}

function RoleCards({ roles, playerDescriptions, activePlayer }) {
  if (!roles || roles.length === 0) return null

  return (
    <div className="card">
      <SectionHeading>Role Assignments</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((row, i) => {
          const player = cleanPlayer(row.Player)
          const role = row.Role || row.Position || ''
          const group = row.Group || ''
          const desc  = playerDescriptions[player] || ''
          const isActive = activePlayer && activePlayer !== 'all' && player === activePlayer
          const isDim = activePlayer && activePlayer !== 'all' && player !== activePlayer

          return (
            <div
              key={i}
              className={`rounded-lg border p-3 transition-all ${
                isActive
                  ? 'border-siege-accent bg-siege-accent/10'
                  : isDim
                  ? 'border-siege-border/30 opacity-40'
                  : 'border-siege-border bg-black/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <PlayerAvatar name={player} size="sm" />
                <span className="text-white font-semibold text-sm">{player}</span>
              </div>
              <p className="text-siege-accent text-xs font-medium mb-1">{role}</p>
              {group && <p className="text-siege-muted text-xs mb-1.5">{group}</p>}
              {desc && <p className="text-gray-400 text-xs leading-relaxed border-t border-siege-border/40 pt-1.5 mt-1.5">{desc}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExecuteSequence({ steps, activePlayer }) {
  if (!steps || steps.length === 0) return null

  const visible = activePlayer && activePlayer !== 'all'
    ? steps // show all steps but highlight player's name
    : steps

  return (
    <div className="card">
      <SectionHeading>Execute Sequence</SectionHeading>
      <div className="space-y-3">
        {visible.map(step => {
          const relevant = mentionsPlayer(step.text, activePlayer !== 'all' ? activePlayer : null)
          const dim = activePlayer && activePlayer !== 'all' && !relevant

          return (
            <div key={step.n} className={`flex gap-3 transition-opacity ${dim ? 'opacity-30' : ''}`}>
              <div className="w-6 h-6 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent text-xs font-bold flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <span className="text-white text-sm font-semibold">{step.label}</span>
                <span className="text-siege-muted text-sm"> — </span>
                <span className="text-gray-300 text-sm">
                  <HighlightedText
                    text={step.text}
                    player={activePlayer !== 'all' ? activePlayer : null}
                  />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlantCard({ primary, alternate }) {
  if (!primary && !alternate) return null
  return (
    <div className="card">
      <SectionHeading>Plant Position</SectionHeading>
      <div className="space-y-2">
        {primary && (
          <div className="flex gap-2 items-start">
            <span className="text-siege-green text-xs font-semibold w-16 flex-shrink-0 mt-0.5">Primary</span>
            <p className="text-gray-300 text-sm">{primary}</p>
          </div>
        )}
        {alternate && (
          <div className="flex gap-2 items-start">
            <span className="text-yellow-400 text-xs font-semibold w-16 flex-shrink-0 mt-0.5">Alternate</span>
            <p className="text-gray-300 text-sm">{alternate}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PostPlantCard({ postPlant, activePlayer }) {
  if (!postPlant || postPlant.length === 0) return null

  const headers = Object.keys(postPlant[0])

  return (
    <div className="card">
      <SectionHeading>Post-Plant Positions</SectionHeading>
      <div className="space-y-2">
        {postPlant.map((row, i) => {
          const player = cleanPlayer(row.Player || row[headers[0]])
          const position = row.Position || row[headers[1]] || ''
          const job = row.Job || row[headers[2]] || ''
          const isActive = activePlayer && activePlayer !== 'all' && player === activePlayer
          const isDim = activePlayer && activePlayer !== 'all' && player !== activePlayer

          return (
            <div
              key={i}
              className={`flex gap-3 items-start p-2 rounded-lg transition-all ${
                isActive ? 'bg-siege-accent/10 border border-siege-accent/30' :
                isDim    ? 'opacity-30' : ''
              }`}
            >
              <span className="text-white text-sm font-semibold w-14 flex-shrink-0">{player}</span>
              <div className="min-w-0">
                <span className="text-siege-accent text-xs font-medium block">{position}</span>
                {job && <span className="text-gray-400 text-xs">{job}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WatchForCard({ watchItems }) {
  if (!watchItems || watchItems.length === 0) return null
  return (
    <div className="card">
      <SectionHeading>Watch For</SectionHeading>
      <div className="space-y-3">
        {watchItems.map((w, i) => (
          <div key={i} className="flex gap-2.5">
            <svg className="w-4 h-4 text-siege-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              {w.title && <span className="text-white text-sm font-semibold">{w.title} — </span>}
              <span className="text-gray-400 text-sm">{w.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WinConditionsCard({ winConditions, activePlayer }) {
  if (!winConditions || winConditions.length === 0) return null

  const labels = ['A', 'B', 'C', 'D']
  const colors = ['text-siege-green', 'text-blue-300', 'text-yellow-400', 'text-siege-muted']

  return (
    <div className="card">
      <SectionHeading>Win Conditions</SectionHeading>
      <div className="space-y-4">
        {winConditions.map((wc, i) => {
          const isCallout = activePlayer && activePlayer !== 'all' &&
            mentionsPlayer(wc.callout, activePlayer)
          const isDim = activePlayer && activePlayer !== 'all' &&
            !mentionsPlayer(wc.title + wc.when + wc.description + wc.callout, activePlayer)

          return (
            <div
              key={i}
              className={`border-l-2 pl-3 transition-all ${
                isCallout ? 'border-siege-accent' :
                isDim     ? 'border-siege-border/20 opacity-30' :
                'border-siege-border/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${colors[i] || 'text-white'}`}>
                  Win {labels[i] || i + 1}
                </span>
                <span className="text-white text-sm font-semibold">
                  — {wc.title.replace(/^Win [A-D]\s*[—–]\s*/i, '')}
                </span>
              </div>
              {wc.when && (
                <p className="text-siege-muted text-xs mb-1">
                  <span className="font-medium">When: </span>{wc.when}
                </p>
              )}
              {wc.description && (
                <p className="text-gray-400 text-sm mb-1.5">{wc.description}</p>
              )}
              {wc.callout && (
                <p className="text-xs">
                  <span className="text-siege-muted">Who calls it: </span>
                  <span className={isCallout ? 'text-siege-accent font-semibold' : 'text-gray-300'}>
                    {wc.callout}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Player Quick-View (when a player tab is active) ─────────────────────────

function PlayerFocusHeader({ player, roles, playerDescriptions, side }) {
  const row = roles.find(r => cleanPlayer(r.Player) === player)
  if (!row) return null
  const desc = playerDescriptions[player] || ''
  const role = row.Role || row.Position || ''
  const group = row.Group || ''

  return (
    <div className={`card border ${SIDE_BORDER[side]}`}>
      <div className="flex items-center gap-3 mb-3">
        <PlayerAvatar name={player} size="md" />
        <div>
          <h2 className="text-white font-bold text-lg leading-none">{player}</h2>
          <span className={`text-xs font-semibold mt-0.5 inline-block px-2 py-0.5 rounded-full ${SIDE_PILL[side]}`}>
            {side === 'ATK' ? 'Attack' : 'Defense'}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-siege-muted text-xs uppercase tracking-wider mb-0.5">Role</p>
          <p className="text-siege-accent font-semibold text-sm">{role}</p>
        </div>
        {group && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-0.5">Group</p>
            <p className="text-gray-300 text-sm">{group}</p>
          </div>
        )}
        {desc && (
          <div>
            <p className="text-siege-muted text-xs uppercase tracking-wider mb-0.5">Instructions</p>
            <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StratViewer() {
  const { mapName, side, site } = useParams()
  const map = mapsData.find(m => m.name === mapName)

  const decodedSite = decodeURIComponent(site)
  const sideUpper = side.toUpperCase()
  const strat = map?.strats.find(s => s.side === sideUpper && s.site === decodedSite)

  // Parse structured content from the raw markdown
  const parsed = useMemo(() => parseStratContent(strat?.content), [strat?.content])

  // Player list from roles (cleaned names, unique)
  const players = useMemo(() => {
    if (!strat?.roles) return []
    return [...new Set(strat.roles.map(r => cleanPlayer(r.Player)).filter(Boolean))]
  }, [strat?.roles])

  const [activePlayer, setActivePlayer] = useState('all')

  if (!map) {
    return <NotFound icon="🗺" title="Map not found" message={`"${mapName}" isn't in the map pool.`} backTo="/maps" backLabel="Back to Maps" />
  }

  if (!strat) {
    return <NotFound icon="📋" title="Strat not found" message={`No ${sideUpper} strat for "${decodedSite}" on ${map.displayName}.`} backTo={`/maps/${mapName}`} backLabel={`Back to ${map.displayName}`} />
  }

  const sideLabel = sideUpper === 'ATK' ? 'Attack' : 'Defense'
  const sideColor = SIDE_COLOR[sideUpper]

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-siege-muted flex-wrap">
        <Link to="/maps" className="hover:text-siege-accent">Maps</Link>
        <span>/</span>
        <Link to={`/maps/${mapName}`} className="hover:text-siege-accent">{map.displayName}</Link>
        <span>/</span>
        <span className={sideColor}>{sideLabel}</span>
        <span>/</span>
        <span className="text-white">{strat.site}</span>
      </div>

      {/* Header card */}
      <div className={`card border-l-4 ${SIDE_BORDER[sideUpper]}`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className={`text-sm font-bold ${sideColor}`}>{sideLabel}</span>
              <StatusDot status={strat.status} showLabel />
              {strat.formation && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-siege-border text-siege-muted font-medium">
                  {strat.formation}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{map.displayName} — {strat.site}</h1>
            {strat.siteContext && (
              <p className="text-siege-muted text-sm mt-1.5 max-w-2xl leading-relaxed">{strat.siteContext}</p>
            )}
          </div>
          {/* Inline strat nav — hidden on mobile (bottom nav serves that role) */}
          <div className="hidden sm:block">
            <StratNav currentStrat={strat} allStrats={map.strats} mapName={mapName} inline />
          </div>
        </div>
      </div>

      {/* Player filter tabs */}
      {players.length > 0 && (
        <div className="flex gap-1 border-b border-siege-border overflow-x-auto">
          {['all', ...players].map(p => (
            <button
              key={p}
              onClick={() => setActivePlayer(p)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
                activePlayer === p
                  ? 'border-siege-accent text-siege-accent'
                  : 'border-transparent text-siege-muted hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Players' : p}
            </button>
          ))}
        </div>
      )}

      {/* Player focus header (only when a player is selected) */}
      {activePlayer !== 'all' && (
        <PlayerFocusHeader
          player={activePlayer}
          roles={strat.roles}
          playerDescriptions={parsed.playerDescriptions}
          side={sideUpper}
        />
      )}

      {/* Spawn */}
      {activePlayer === 'all' && <SpawnCard spawn={parsed.spawn} />}

      {/* Role assignments */}
      <RoleCards
        roles={strat.roles}
        playerDescriptions={parsed.playerDescriptions}
        activePlayer={activePlayer}
      />

      {/* Execute Sequence */}
      <ExecuteSequence steps={parsed.executeSteps} activePlayer={activePlayer} />

      {/* Plant position (ATK only) */}
      {sideUpper === 'ATK' && activePlayer === 'all' && (
        <PlantCard primary={parsed.primaryPlant} alternate={parsed.alternatePlant} />
      )}

      {/* Post-plant positions */}
      <PostPlantCard postPlant={parsed.postPlant} activePlayer={activePlayer} />

      {/* Watch For */}
      {activePlayer === 'all' && <WatchForCard watchItems={parsed.watchItems} />}

      {/* Win Conditions */}
      <WinConditionsCard winConditions={parsed.winConditions} activePlayer={activePlayer} />

      {/* Raw content fallback — shown when structured parsing produced nothing */}
      {activePlayer === 'all' &&
        !parsed.spawn && !parsed.executeSteps?.length && !parsed.postPlant?.length &&
        !parsed.watchItems?.length && !parsed.winConditions?.length &&
        strat.content && (
          <div className="card">
            <SectionHeading>Strat Notes</SectionHeading>
            <MarkdownContent content={strat.content} />
          </div>
        )
      }

      {/* Bottom nav */}
      <StratNav currentStrat={strat} allStrats={map.strats} mapName={mapName} />

    </div>
  )
}

// ─── Strat Navigation ─────────────────────────────────────────────────────────

function StratNavLabel({ strat }) {
  const sideColor = strat.side === 'ATK' ? 'text-orange-400' : 'text-blue-400'
  return (
    <>
      <span className={`font-semibold ${sideColor}`}>{strat.side}</span>
      <span className="text-siege-muted"> · </span>
      <span>{strat.site}</span>
    </>
  )
}

function StratNav({ currentStrat, allStrats, mapName, inline }) {
  const currentIdx = allStrats.findIndex(
    s => s.side === currentStrat.side && s.site === currentStrat.site
  )
  const prev = currentIdx > 0 ? allStrats[currentIdx - 1] : null
  const next = currentIdx < allStrats.length - 1 ? allStrats[currentIdx + 1] : null

  if (inline) {
    if (!prev && !next) return null
    return (
      <div className="flex gap-3 text-sm flex-shrink-0">
        {prev && (
          <Link
            to={`/maps/${mapName}/${prev.side.toLowerCase()}/${encodeURIComponent(prev.site)}`}
            className="text-siege-muted hover:text-white flex items-center gap-1 transition-colors"
          >
            ←&nbsp;<StratNavLabel strat={prev} />
          </Link>
        )}
        {prev && next && <span className="text-siege-border">·</span>}
        {next && (
          <Link
            to={`/maps/${mapName}/${next.side.toLowerCase()}/${encodeURIComponent(next.site)}`}
            className="text-siege-muted hover:text-white flex items-center gap-1 transition-colors"
          >
            <StratNavLabel strat={next} />&nbsp;→
          </Link>
        )}
      </div>
    )
  }

  if (!prev && !next) return null

  return (
    <div className="flex justify-between pt-2 border-t border-siege-border">
      {prev ? (
        <Link
          to={`/maps/${mapName}/${prev.side.toLowerCase()}/${encodeURIComponent(prev.site)}`}
          className="text-siege-muted hover:text-white text-sm flex items-center gap-1 transition-colors py-3 pr-4"
        >
          ←&nbsp;<StratNavLabel strat={prev} />
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/maps/${mapName}/${next.side.toLowerCase()}/${encodeURIComponent(next.site)}`}
          className="text-siege-muted hover:text-white text-sm flex items-center gap-1 transition-colors py-3 pl-4"
        >
          <StratNavLabel strat={next} />&nbsp;→
        </Link>
      ) : <div />}
    </div>
  )
}
