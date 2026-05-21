import { RIS_MIN, RIS_MAX, RIS_BASELINE_PCT, risColor } from '../utils/constants'

export default function RisBar({ ris, className = 'h-2 mb-1' }) {
  const risNum = parseFloat(ris)
  const hasData = !isNaN(risNum)
  const fillPct = hasData
    ? Math.max(0, Math.min(100, ((risNum - RIS_MIN) / (RIS_MAX - RIS_MIN)) * 100))
    : 0
  const color = hasData ? risColor(ris) : ''

  return (
    <div className={`relative bg-siege-border rounded-full overflow-visible ${className}`}>
      {hasData && (
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${color}`}
          style={{ width: `${fillPct}%` }}
        />
      )}
      <div
        className="absolute top-0 h-full w-px bg-white/30"
        style={{ left: `${RIS_BASELINE_PCT}%` }}
      />
    </div>
  )
}
