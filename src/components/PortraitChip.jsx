import { useState } from 'react'
import { getPortraitUrl } from '../utils/operatorPortraits'

export default function PortraitChip({ name, size = 'w-5 h-5' }) {
  const [err, setErr] = useState(false)
  return (
    <div
      className={`${size} rounded overflow-hidden bg-siege-border flex-shrink-0 ring-1 ring-siege-border flex items-center justify-center`}
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
