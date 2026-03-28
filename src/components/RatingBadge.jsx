const ratingMap = {
  strong: { label: '✅ Strong', cls: 'badge-strong' },
  moderate: { label: '⚠️ Moderate', cls: 'badge-moderate' },
  weak: { label: '⚠️ Weak', cls: 'badge-weak' },
  avoid: { label: '❌ Avoid', cls: 'badge-avoid' },
  unknown: { label: '? Unknown', cls: 'badge-unknown' },
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
