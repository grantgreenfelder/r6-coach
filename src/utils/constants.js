// ─── Shared constants for the R6 Coaching Dashboard ───────────────────────────
// Single source of truth for thresholds and display helpers used across pages.

// ─── Win Rate Thresholds ──────────────────────────────────────────────────────
// Returns a Tailwind text color class based on win rate value.
export function wrColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 55) return 'text-siege-green'
  if (v >= 45) return 'text-white'
  if (v >= 35) return 'text-yellow-400'
  return 'text-siege-red'
}

// Returns a Tailwind bg color class based on win rate value.
export function wrBgColor(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'bg-siege-muted'
  if (v >= 55) return 'bg-siege-green'
  if (v >= 45) return 'bg-blue-400'
  if (v >= 35) return 'bg-yellow-500'
  return 'bg-siege-red'
}

// Returns a Tailwind border+bg tile class for map heatmap tiles.
export function wrTileClass(wr) {
  const v = parseFloat(wr)
  if (isNaN(v)) return 'border-siege-border text-siege-muted bg-siege-border/10'
  if (v >= 55) return 'border-siege-green/40 text-siege-green bg-siege-green/10'
  if (v >= 45) return 'border-blue-400/40 text-blue-300 bg-blue-400/10'
  if (v >= 35) return 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
  return 'border-siege-red/40 text-siege-red bg-siege-red/10'
}

// ─── RIS Scale ────────────────────────────────────────────────────────────────
export const RIS_MIN = 25
export const RIS_MAX = 75
export const RIS_BASELINE = 50
export const RIS_BASELINE_PCT = ((RIS_BASELINE - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100 // 50%

// Returns a Tailwind bg color class based on RIS value.
export function risColor(ris) {
  const v = parseFloat(ris)
  if (isNaN(v)) return 'bg-siege-muted'
  if (v >= 58) return 'bg-siege-green'
  if (v >= 48) return 'bg-blue-400'
  if (v >= 38) return 'bg-yellow-500'
  return 'bg-siege-red'
}

// ─── K/D Thresholds ───────────────────────────────────────────────────────────
export function kdColor(kd) {
  const v = parseFloat(kd)
  if (isNaN(v)) return 'text-siege-muted'
  if (v >= 1.3) return 'text-siege-green'
  if (v >= 0.9) return 'text-gray-300'
  return 'text-siege-red'
}
