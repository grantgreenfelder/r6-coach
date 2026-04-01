import { useState } from 'react'
import { getPlayerPhotoUrl } from '../utils/playerPhotos'

/**
 * Player avatar: shows a real photo if available, falls back to letter initial.
 *
 * Props:
 *   name   — player display name
 *   size   — 'sm' (32px, Roster/Dashboard cards)
 *            'md' (40px, StratViewer player focus)
 *            'lg' (56px, Player Detail header)
 */
export default function PlayerAvatar({ name, size = 'sm' }) {
  const [err, setErr] = useState(false)
  const photoUrl = getPlayerPhotoUrl(name)

  const dims = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  }[size] || 'w-8 h-8 text-sm'

  if (photoUrl && !err) {
    return (
      <div className={`${dims} rounded-full overflow-hidden flex-shrink-0 ring-1 ring-siege-border bg-siege-border`}>
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-top"
          onError={() => setErr(true)}
        />
      </div>
    )
  }

  // Fallback: amber initial circle — solid for lg (detail page), translucent for sm/md
  const bg = size === 'lg'
    ? 'bg-siege-accent text-siege-bg'
    : 'bg-siege-accent/20 text-siege-accent'

  return (
    <div className={`${dims} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${bg}`}>
      {name?.[0]}
    </div>
  )
}
