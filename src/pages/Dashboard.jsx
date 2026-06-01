import { use, useState } from 'react'
import { Link } from 'react-router-dom'
import { playersPromise } from '../data/playersResource'
import { mapsPromise } from '../data/mapsResource'
import { risTextColor, risColor, wrColor, wrTileClass, kdColor, RIS_MIN, RIS_MAX, RIS_BASELINE_PCT } from '../utils/constants'
import HelpTip from '../components/HelpTip'
import { GLOSSARY } from '../utils/glossary'
import { getMapThumbnailUrl } from '../utils/mapThumbnails'
import { SNAPSHOT_DATE } from '../utils/snapshot'
import PlayerAvatar from '../components/PlayerAvatar.jsx'
import RisBar from '../components/RisBar.jsx'
import PortraitChip from '../components/PortraitChip.jsx'

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

function PlayerCard({ player }) {
  const { kd, ris, winRate, rank } = player.stats || {}
  const wrNum = parseFloat(winRate) || 0
  const topAtk = player._topAtkOps ?? []
  const topDef = player._topDefOps ?? []

  return (
    <Link
      to={`/players/${player.name}`}
      className="card hover:border-siege-accent transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlayerAvatar name={player.name} size="sm" />
          <span className="text-white font-semibold group-hover:text-siege-accent transition-colors">{player.name}</span>
        </div>
        <span className="text-siege-muted text-xs">{rank ?? '—'}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className={`text-white text-lg font-bold leading-none ${kdColor(kd)}`}>{kd ?? '—'}</p>
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

      <RisBar ris={ris} />
      <div className="flex justify-between text-xs text-siege-muted mb-2">
        <span className="flex items-center gap-1">RIS <HelpTip text={GLOSSARY.RIS_BAR} position="bottom" /></span>
        <span>baseline 50</span>
      </div>

      {(topAtk.length > 0 || topDef.length > 0) && (
        <div className="flex gap-3 mt-1">
          {topAtk.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-orange-400 text-[10px] font-semibold uppercase">Atk</span>
              {topAtk.map(n => <PortraitChip key={n} name={n} size="w-5 h-5" />)}
            </div>
          )}
          {topDef.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-blue-400 text-[10px] font-semibold uppercase">Def</span>
              {topDef.map(n => <PortraitChip key={n} name={n} size="w-5 h-5" />)}
            </div>
          )}
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
    <div className="card">
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

// ─── Spotlight ─────────────────────────────────────────────────────────────────

function Spotlight({ mainStack, spotlightMap }) {
  const risPlayers = mainStack.filter(p => p.stats?.ris && p.stats.ris !== '—')
  const mvp = risPlayers.length > 0
    ? risPlayers.reduce((a, b) => parseFloat(a.stats.ris) > parseFloat(b.stats.ris) ? a : b)
    : null

  const esrPlayers = mainStack.filter(p => p.stats?.esr)
  const topESR = esrPlayers.length > 0
    ? esrPlayers.reduce((a, b) => parseFloat(a.stats.esr) > parseFloat(b.stats.esr) ? a : b)
    : null

  return (
    <div className="card">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">⭐ Spotlight</h2>
      <div className="space-y-3">
        {mvp && (
          <Link to={`/players/${mvp.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-green/10 border border-siege-green/30 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-siege-green/20 flex items-center justify-center text-siege-green font-bold flex-shrink-0">
              {mvp.name[0]}
            </div>
            <div>
              <p className="text-siege-green font-semibold text-sm">{mvp.name} — Season Leader</p>
              <p className="text-gray-400 text-xs mt-0.5">RIS {mvp.stats.ris} · K/D {mvp.stats.kd} · {mvp.stats.winRate} Win%</p>
            </div>
          </Link>
        )}

        {spotlightMap && (
          <Link to={`/maps/${spotlightMap.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-siege-accent/10 border border-siege-accent/20 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-siege-accent/20 flex items-center justify-center text-siege-accent font-bold text-lg flex-shrink-0">🗺</div>
            <div>
              <p className="text-siege-accent font-semibold text-sm">{spotlightMap.displayName} — Confidence Map</p>
              <p className="text-gray-400 text-xs mt-0.5">{spotlightMap.teamWinRate}% team WR · {spotlightMap.teamWinRateMatches}M tracked</p>
            </div>
          </Link>
        )}

        {topESR && (
          <Link to={`/players/${topESR.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">⚡</div>
            <div>
              <p className="text-blue-300 font-semibold text-sm">{topESR.name} — Entry Leader</p>
              <p className="text-gray-400 text-xs mt-0.5">ESR {topESR.stats.esr} · best entry success rate on the stack</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const playersData = use(playersPromise)
  const mapsData    = use(mapsPromise)
  const mainStack   = playersData.mainStack || []
  const bTeam       = playersData.bTeam     || []
  const rankedMaps  = mapsData.filter(m => m.inRankedPool)

  // Live update timestamp + staleness check (cron runs every 12h; >18h = a missed run)
  const updatedAt = playersData._updatedAt
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null
  const [nowMs] = useState(() => Date.now())
  const hoursSince = updatedAt ? (nowMs - new Date(updatedAt).getTime()) / 3.6e6 : null
  const stale = hoursSince != null && hoursSince > 18

  // Best / ban target maps
  const rankedWithWR = rankedMaps.filter(m => m.teamWinRate !== null)
  const bestMap  = rankedWithWR.length > 0 ? rankedWithWR.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b) : null
  const banTarget = rankedWithWR.length > 0 ? rankedWithWR.reduce((a, b) => a.teamWinRate < b.teamWinRate ? a : b) : null

  // Team avg KD
  const kdValues = mainStack.map(p => parseFloat(p.stats?.kd)).filter(n => !isNaN(n))
  const avgKD = kdValues.length > 0 ? (kdValues.reduce((a, b) => a + b, 0) / kdValues.length).toFixed(2) : '—'

  // Team avg ESR
  const esrValues = mainStack.map(p => parseFloat(p.stats?.esr)).filter(n => !isNaN(n))
  const avgESR = esrValues.length > 0 ? (esrValues.reduce((a, b) => a + b, 0) / esrValues.length).toFixed(2) : '—'

  // Spotlight map — highest confidence (≥20M) with best WR
  const confidentMaps = rankedWithWR.filter(m => m.teamWinRateMatches >= 20)
  const spotlightMap  = confidentMaps.length > 0
    ? confidentMaps.reduce((a, b) => a.teamWinRate > b.teamWinRate ? a : b)
    : bestMap

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
            <p className={`text-xs mt-0.5 ${stale ? 'text-yellow-400' : 'text-siege-muted'}`}>
              {updatedLabel
                ? (stale
                    ? `⚠ Player stats may be stale · last updated ${updatedLabel}`
                    : `Player stats live · updated ${updatedLabel}`)
                : 'Season Dashboard'}
            </p>
          </div>
        </div>
        <Link to="/players" className="text-siege-accent text-sm font-medium hover:underline transition-colors">
          Roster →
        </Link>
      </div>

      {/* Insight strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InsightCard
          label="Best Map"
          value={bestMap ? bestMap.displayName : '—'}
          sub={bestMap ? `${bestMap.teamWinRate}% WR · snapshot` : 'no data'}
          color="text-siege-green"
          to={bestMap ? `/maps/${bestMap.name}` : undefined}
          thumbnailUrl={bestMap ? getMapThumbnailUrl(bestMap.name) : undefined}
        />
        <InsightCard
          label="Ban Target"
          value={banTarget ? banTarget.displayName : '—'}
          sub={banTarget ? `${banTarget.teamWinRate}% WR · snapshot` : 'no data'}
          color="text-siege-red"
          to={banTarget ? `/maps/${banTarget.name}` : undefined}
          thumbnailUrl={banTarget ? getMapThumbnailUrl(banTarget.name) : undefined}
        />
        <InsightCard label="Team Avg K/D"  value={avgKD}  sub="main stack ranked" color="text-siege-accent" />
        <InsightCard label="Team Avg ESR"  value={avgESR} sub="entry success rate" color="text-siege-accent" tip={GLOSSARY.ESR} />
      </div>

      {/* Player cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Main Stack</h2>
          <Link to="/players" className="text-xs text-siege-accent hover:underline">All players →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {mainStack.map(player => <PlayerCard key={player.name} player={player} />)}
        </div>
      </div>

      {/* Map heatmap */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
            Ranked Pool — Win% Heatmap
            {SNAPSHOT_DATE && <span className="text-siege-muted text-[10px] font-normal normal-case tracking-normal ml-2">snapshot · {SNAPSHOT_DATE}</span>}
          </h2>
          <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-siege-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-siege-green inline-block" />≥60%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />50–59%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />40–49%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />30–39%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt;30%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-2">
          {rankedMaps.map(map => <MapTile key={map.name} map={map} />)}
        </div>
        <Link to="/maps" className="block text-xs text-siege-muted hover:text-siege-accent mt-2 text-right transition-colors">
          View all maps →
        </Link>
      </div>

      {/* Bottom row: RIS Leaderboard + Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RisLeaderboard players={[...mainStack, ...bTeam]} />
        <Spotlight mainStack={mainStack} spotlightMap={spotlightMap} />
      </div>

    </div>
  )
}
