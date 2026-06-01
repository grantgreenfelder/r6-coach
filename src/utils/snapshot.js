import metaData from '../data/meta.json'

// Map win rates (team + per-player) come from the manually-parsed KB, not the
// live API — no public source exposes per-team/per-player map stats. This is the
// date that frozen map data was last captured, used to label it honestly.
const _d = new Date(metaData.parsedAt)
export const SNAPSHOT_DATE = isNaN(_d.getTime())
  ? null
  : _d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const MAP_SNAPSHOT_NOTE = SNAPSHOT_DATE
  ? `Map win rates are a manual snapshot from ${SNAPSHOT_DATE} — not live.`
  : 'Map win rates are a manual snapshot — not live.'
