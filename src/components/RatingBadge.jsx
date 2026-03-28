const ratingMap = {
  strong:  { label: '✅ Strong',  cls: 'badge-strong' },
  even:    { label: '🔵 Even',    cls: 'badge-even' },
  shaky:   { label: '⚠️ Shaky',   cls: 'badge-shaky' },
  avoid:   { label: '🟠 Avoid',   cls: 'badge-avoid' },
  ban:     { label: '❌ Ban',     cls: 'badge-ban' },
  unknown: { label: '? Unknown',  cls: 'badge-unknown' },
  // legacy
  moderate: { label: '⚠️ Moderate', cls: 'badge-moderate' },
  weak:     { label: '⚠️ Weak',     cls: 'badge-weak' },
}

// size="sm" | "md" (default) | "lg"
const sizeMap = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-3 py-1',
}

export default function RatingBadge({ rating, size = 'md' }) {
  const { label, cls } = ratingMap[rating] || ratingMap.unknown
  const sizeCls = sizeMap[size] || sizeMap.md
  return <span className={`${cls} ${sizeCls}`}>{label}</span>
}
