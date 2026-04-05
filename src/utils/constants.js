// ─── Shared constants for the DOE · R6 Division ───────────────────────────────
// Single source of truth for thresholds and display helpers used across pages.

// ─── Win Rate Thresholds (map/session level: 60/50/40/30 — matches 5-tier badge) ──
// Used for: map heatmap, session prep veto rows, map stats tables.

// Returns a Tailwind text color class.
export function wrColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 60) return 'text-siege-green'
  if (v >= 50) return 'text-blue-400'
  if (v >= 40) return 'text-yellow-400'
  if (v >= 30) return 'text-orange-400'
  return 'text-red-400'
}

// Returns a Tailwind bg color class (for bar fills).
export function wrBgColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'bg-siege-muted'
  if (v >= 60) return 'bg-siege-green'
  if (v >= 50) return 'bg-blue-500'
  if (v >= 40) return 'bg-yellow-500'
  if (v >= 30) return 'bg-orange-500'
  return 'bg-red-600'
}

// Returns a Tailwind border+bg+text tile class (for map heatmap tiles).
export function wrTileClass(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'border-siege-border text-siege-muted bg-siege-border/10'
  if (v >= 60) return 'border-siege-green/40 text-siege-green bg-siege-green/10'
  if (v >= 50) return 'border-blue-500/40 text-blue-300 bg-blue-500/10'
  if (v >= 40) return 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
  if (v >= 30) return 'border-orange-500/40 text-orange-400 bg-orange-500/10'
  return 'border-red-600/40 text-red-400 bg-red-600/10'
}

// ─── Operator Win Rate Thresholds (stricter: 58/48/38) ────────────────────────
// Used for: per-operator stat rows in PlayerDetail and OperatorDetail.
// Higher bar because per-op samples are smaller.

// Returns a Tailwind text color class.
export function opWrColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 58) return 'text-siege-green'
  if (v >= 48) return 'text-blue-300'
  if (v >= 38) return 'text-yellow-400'
  return 'text-siege-red'
}

// Returns a Tailwind bg color class (for bar fills).
export function opWrBgColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'bg-siege-muted'
  if (v >= 58) return 'bg-siege-green'
  if (v >= 48) return 'bg-blue-400'
  if (v >= 38) return 'bg-yellow-500'
  return 'bg-siege-red'
}

// ─── RIS Scale ────────────────────────────────────────────────────────────────
export const RIS_MIN = 25
export const RIS_MAX = 75
export const RIS_BASELINE = 50
export const RIS_BASELINE_PCT = ((RIS_BASELINE - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100 // 50%

// Returns a Tailwind bg color class (for RIS bar fills).
export function risColor(ris) {
  const v = parseFloat(ris)
  if (isNaN(v)) return 'bg-siege-muted'
  if (v >= 58) return 'bg-siege-green'
  if (v >= 48) return 'bg-blue-400'
  if (v >= 38) return 'bg-yellow-500'
  return 'bg-siege-red'
}

// Returns a Tailwind text color class (for RIS values in stat boxes).
export function risTextColor(ris) {
  const v = parseFloat(ris)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 58) return 'text-siege-green'
  if (v >= 48) return 'text-blue-300'
  if (v >= 38) return 'text-yellow-400'
  return 'text-siege-red'
}

// ─── K/D Thresholds ───────────────────────────────────────────────────────────
export function kdColor(kd) {
  const v = parseFloat(kd)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 1.3) return 'text-siege-green'
  if (v >= 0.9) return 'text-gray-300'
  return 'text-siege-red'
}
