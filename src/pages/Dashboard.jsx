import { Link } from 'react-router-dom'
import { useState } from 'react'
import playersData from '../data/players.json'
import mapsData from '../data/maps.json'
import stackData from '../data/stack.json'
import metaData from '../data/meta.json'
import { RIS_MIN, RIS_MAX, RIS_BASELINE_PCT, risColor, risTextColor, wrColor, wrTileClass } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import { getMapThumbnailUrl } from '../utils/mapThumbnails'
import { getPortraitUrl } from '../utils/operatorPortraits'
import PlayerAvatar from '../components/PlayerAvatar.jsx'

// ─── Op Portrait Chips ─────────────────────────────────────────────────────────

function PortraitChip({ name }) {
  const [err, setErr] = useState(false)
  return (
    <div
      className="w-5 h-5 rounded overflow-hidden bg-siege-border flex-shrink-0 ring-1 ring-siege-border flex items-center justify-center"
      title={name}
    >
      {!err ? (
        <img
          src={getPortraitUrl(name)}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-top"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-siege-accent text-[8px] font-bold leading-none select-none">{name[0]}</span>
      )}
    </div>
  )
}

function OpChips({ label, opsString }) {
  if (!opsString) return null
  const ops = opsString.split(/[,/]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 text-[10px]">{label}</span>
      {ops.map(name => <PortraitChip key={name} name={name} />)}
    </div>
  )
}

// ─── Insight Strip ─────────────────────────────────────────────────────────────

function InsightCard({ label, value, sub, color = 'text-siege-accent', to, thumbnailUrl }) {
  const inner = (
    <div className="card min-w-0 relative overflow-hidden">
      {thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}
      <p className="relative text-siege-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`relative text-xl font-bold truncate ${color}`}>{value}</p>
      {sub && <p className="relative text-siege-muted text-xs mt-0.5 truncate">{sub}</p>}
    </div>
  )
  return to ? <Link to={to} className="min-w-0 hover:opacity-80 transition-opacity">{inner}</Link> : inner
}

// ─── Player Card ───────────────────────────────────────────────────────────────

// RIS bar: scale 25–75 so the typical range fills the full bar width.
// Baseline of 50 is marked with a tick.
function RisBar({ ris }) {
  const risNum = parseFloat(ris)
  if (isNaN(risNum)) return null
  const fillPct = Math.max(0, Math.min(100, ((risNum - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100))
  const color = risColor(ris)

  return (
    <div className="relative h-2 bg-siege-border rounded-full overflow-visible mb-1">
      {/* Fill */}
      <div
        className={`absolute top-0 left-0 h-full rounded-full ${color}`}
        style={{ width: `${fillPct}%` }}
      />
      {/* Baseline tick */}
      <div
        className="absolute top-0 h-full w-px bg-white/30"
        style={{ left: `${RIS_BASELINE_PCT}%` }}
      />
    </div>
  )
}

function PlayerCard({ player }) {
  const { kd, ris, winRate, rank } = player.stats
  const wrNum = parseFloat(winRate) || 0

  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent transition-colors group"
    >
      {/* Name + rank */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlayerAvatar name={player.name} size="sm" />
          <span className="text-white font-semibold group-hover:text-siege-accent transition-colors">{player.name}</span>
        </div>
        <span className="text-siege-muted text-xs">{rank}</span>
      </div>

      {/* Big stat numbers */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-white text-lg font-bold leading-none">{kd ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">K/D <HelpTip text={GLOSSARY.KD} /></p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${risTextColor(ris)}`}>{ris ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">RIS <HelpTip text={GLOSSARY.RIS} /></p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${wrColor(wrNum)}`}>{winRate ?? '—'}</p>
          <p className="text-siege-muted text-xs mt-0.5 flex items-center justify-center gap-1">Win% <HelpTip text={GLOSSARY.WR} /></p>
        </div>
      </div>

      {/* RIS bar with baseline marker — tick already drawn inside RisBar */}
      <RisBar ris={ris} />
      <div className="flex justify-between text-xs text-siege-muted mb-2">
        <span className="flex items-center gap-1">RIS <HelpTip text={GLOSSARY.RIS_BAR} position="bottom" /></span>
        <span>baseline 50</span>
      </div>

      {/* Ops */}
      {(player.atkOps || player.defOps) && (
        <div className="flex gap-3">
          <OpChips label="Atk" opsString={player.atkOps} />
          <OpChips label="Def" opsString={player.defOps} />
        </div>
      )}
    </Link>
  )
}

// ─── Map Heatmap ───────────────────────────────────────────────────────────────

function MapTile({ map }) {
  const wr = map.teamWinRate
  const bg = wr === null
    ? 'bg-siege-card border-siege-border text-siege-muted'
    : wrTileClass(wr)
  const thumbnailUrl = getMapThumbnailUrl(map.name)

  return (
    <Link
      to={`/maps/${map.name}`}
      className={`relative overflow-hidden border rounded-lg px-1.5 py-2.5 sm:px-2 sm:py-2 text-center hover:opacity-80 transition-opacity min-h-[52px] flex flex-col justify-center ${bg}`}
    >
      {thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}
      <p className="relative text-[10px] sm:text-xs font-medium leading-tight truncate">{map.displayName}</p>
      <p className="relative text-xs sm:text-sm font-bold mt-0.5">{wr !== null ? `${wr}%` : '—'}</p>
    </Link>
  )
}

// ─── RIS Leaderboard ───────────────────────────────────────────────────────────

function RisLeaderboard({ players }) {
  const sorted = [...players]
    .filter(p => p.stats?.ris && p.stats.ris !== '—')
    .sort((a, b) => parseFloat(b.stats.ris) - parseFloat(a.stats.ris))

  return (
    <div className="card lg:col-span-1">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
        RIS Standings <HelpTip text={GLOSSARY.RIS} />
      </h2>
      <div className="space-y-1">
        {sorted.map((p, i) => {
          const ris = parseFloat(p.stats.ris)
          const fillPct = Math.max(0, Math.min(100, ((ris - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100))
          const barColor = risColor(ris)
          const textColor = risTextColor(ris)
          return (
            <Link
              key={p.name}
              to={`/players/${p.name}`}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-siege-border/30 transition-colors group"
            >
              <span className="text-siege-muted text-xs w-4 flex-shrink-0 tabular-nums text-right">{i + 1}</span>
              <PlayerAvatar name={p.name} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-gray-300 text-xs group-hover:text-white transition-colors truncate">{p.name}</span>
                  <span className={`text-xs font-bold tabular-nums flex-shrink-0 ml-2 ${textColor}`}>{p.stats.ris}</span>
                </div>
                <div className="relative h-1.5 bg-siege-border rounded-full overflow-visible">
                  <div className={`absolute top-0 left-0 h-full rounded-full ${barColor}`} style={{ width: `${fillPct}%` }} />
                  <div className="absolute top-0 h-full w-px bg-white/25" style={{ left: `${RIS_BASELINE_PCT}%` }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      <p className="text-siege-muted text-[10px] mt-3 text-right">baseline 50 · tick = Gold</p>
    </div>
  )
}

// ─── Coaching Focus ────────────────────────────────────────────────────────────

function CoachingFocus({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div className="card">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Priority Coaching Items</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-black/20 border border-siege-border/50">
            <span className="text-siege-accent font-bold text-sm flex-shrink-0 w-5 tabular-nums">{i + 1}.</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                {item.playerTag && (
                  <Link
                    to={`/players/${item.playerTag}`}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-siege-accent/20 text-siege-accent hover:bg-siege-accent/40 transition-colors font-medium flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    {item.playerTag}
                  </Link>
                )}
              </div>
              {item.body && <p className="text-siege-muted text-xs leading-relaxed">{item.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const mainStack = playersData.mainStack || []
  const rankedMaps = mapsData.filter(m => m.inRankedPool)
  const teamFocusItems = stackData.teamFocusItems || []
  const coachingItems = stackData.coachingItemsStructured || []

  // Best / ban target maps
  const rankedWithWR = rankedMaps.filter(m => m.teamWinRate !== null)
  const bestMap = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : null
  const banTarget = rankedWithWR.length > 0
    ? rankedWithWR.reduce((a, b) => a.teamWinRate < b.teamWinRate ? a : b)
    : null

  // Team avg Win%
  const wrValues = mainStack.map(p => parseFloat(p.stats?.winRate)).filter(n => !isNaN(n))
  const avgWR = wrValues.length > 0
    ? (wrValues.reduce((a, b) => a + b, 0) / wrValues.length).toFixed(1) + '%'
    : '—'
  const topWR = wrValues.length > 0
    ? mainStack.reduce((best, p) => {
        const v = parseFloat(p.stats?.winRate)
        return !isNaN(v) && (best === null || v > parseFloat(best.stats?.winRate)) ? p : best
      }, null)
    : null

  // Spotlight — auto-pick: highest RIS player as MVP, positive team DEF note
  const risPlayers = mainStack.filter(p => p.stats?.ris && p.stats.ris !== '—')
  const mvp = risPlayers.length > 0
    ? risPlayers.reduce((a, b) => parseFloat(a.stats.ris) > parseFloat(b.stats.ris) ? a : b)
    : null

  // Top map by win% with enough data (best confidence map)
  const confidentMaps = rankedWithWR.filter(m => m.teamWinRateMatches >= 20)
  const spotlightMap = confidentMaps.length > 0
    ? confidentMaps.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : bestMap

  // Count how many main stack players are above 50% WR
  const positiveWRCount = mainStack.filter(p => parseFloat(p.stats?.winRate) >= 50).length

  const parsedDate = new Date(metaData.parsedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/doe-seal.png" alt="DOE" className="w-11 h-11 rounded-full ring-1 ring-doe-gold/30 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white leading-tight">R6 Division</h1>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-siege-accent border border-siege-accent/30 px-1.5 py-0.5 rounded">DOE</span>
            </div>
            <p className="text-siege-muted text-xs mt-0.5">Season Dashboard · KB snapshot {parsedDate}</p>
          </div>
        </div>
        <Link
          to="/session-prep"
          className="text-siege-accent text-sm font-medium hover:underline transition-colors"
        >
          Session Prep →
        </Link>
      </div>

      {/* Insight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InsightCard
          label="Best Map Right Now"
          value={bestMap ? bestMap.displayName : '—'}
          sub={bestMap ? `${bestMap.teamWinRate}% win rate` : 'no data'}
          color="text-siege-green"
          to={bestMap ? `/maps/${bestMap.name}` : undefined}
          thumbnailUrl={bestMap ? getMapThumbnailUrl(bestMap.name) : undefined}
        />
        <InsightCard
          label="Ban Target"
          value={banTarget ? banTarget.displayName : '—'}
          sub={banTarget ? `${banTarget.teamWinRate}% win rate` : 'no data'}
          color="text-siege-red"
          to={banTarget ? `/maps/${banTarget.name}` : undefined}
          thumbnailUrl={banTarget ? getMapThumbnailUrl(banTarget.name) : undefined}
        />
        <InsightCard
          label="Team Avg Win%"
          value={avgWR}
          sub={topWR ? `Best: ${topWR.name} @ ${topWR.stats?.winRate}` : undefined}
          color="text-siege-accent"
        />
      </div>

      {/* Player cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Main Stack</h2>
          <Link to="/players" className="text-xs text-siege-accent hover:underline">All players →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {mainStack.map(player => (
            <PlayerCard key={player.name} player={player} />
          ))}
        </div>
      </div>

      {/* Map heatmap */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
            Ranked Pool — Win% Heatmap
          </h2>
          {/* Legend — hidden on mobile to save space, colors are self-evident with the tiles */}
          <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-siege-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-siege-green inline-block" />≥60% Strong</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />50–59% Even</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />40–49% Shaky</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />30–39% Avoid</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt;30% Ban</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-2">
          {rankedMaps.map(map => (
            <MapTile key={map.name} map={map} />
          ))}
        </div>
        <Link to="/maps" className="block text-xs text-siege-muted hover:text-siege-accent mt-2 text-right transition-colors">
          View all maps →
        </Link>
      </div>

      {/* Bottom row: RIS Leaderboard + Spotlight + Team Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* RIS Leaderboard — 1 col */}
        <RisLeaderboard players={mainStack} />

        {/* Spotlight — 1 col */}
        <div className="card lg:col-span-1">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">⭐ Spotlight</h2>
          <div className="space-y-3">

            {/* MVP player */}
            {mvp && (
              <Link to={`/players/${mvp.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-green/10 border border-siege-green/30 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-siege-green/20 flex items-center justify-center text-siege-green font-bold flex-shrink-0">
                  {mvp.name[0]}
                </div>
                <div>
                  <p className="text-siege-green font-semibold text-sm">{mvp.name} — Season Leader</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    RIS {mvp.stats.ris} · K/D {mvp.stats.kd} · {mvp.stats.winRate} Win%
                  </p>
                </div>
              </Link>
            )}

            {/* Top map */}
            {spotlightMap && (
              <Link to={`/maps/${spotlightMap.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-accent/10 border border-siege-accent/20 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-lg flex-shrink-0">
                  🗺
                </div>
                <div>
                  <p className="text-siege-accent font-semibold text-sm">{spotlightMap.displayName} — Confidence Map</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {spotlightMap.teamWinRate}% team win rate · {spotlightMap.teamWinRateMatches} matches tracked
                  </p>
                </div>
              </Link>
            )}

            {/* Positive team note */}
            {positiveWRCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-lg flex-shrink-0">
                  🛡
                </div>
                <div>
                  <p className="text-blue-300 font-semibold text-sm">Defense is the Stack's Identity</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {positiveWRCount} of {mainStack.length} players above 50% win rate — anchor up.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Focus — 1 col */}
        {teamFocusItems.length > 0 && (
          <div className="card lg:col-span-1">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Team Focus</h2>
            <div className="space-y-3">
              {teamFocusItems.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-siege-accent font-bold text-sm flex-shrink-0 w-5">{i + 1}.</span>
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                    {item.body && <p className="text-siege-muted text-xs mt-0.5 leading-relaxed">{item.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Priority Coaching Items — full width */}
      <CoachingFocus items={coachingItems} />

    </div>
  )
}
