const ratingMap = {
  strong: { label: '✅ Strong', cls: 'badge-strong' },
  moderate: { label: '⚠️ Moderate', cls: 'badge-moderate' },
  weak: { label: '⚠️ Weak', cls: 'badge-weak' },
  avoid: { label: '❌ Avoid', cls: 'badge-avoid' },
  unknown: { label: '? Unknown', cls: 'badge-unknown' },
}

export default function RatingBadge({ rating }) {
  const { label, cls } = ratingMap[rating] || ratingMap.unknown
  return <span className={cls}>{label}</span>
}
