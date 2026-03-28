import { useState, useRef, useEffect } from 'react'

/**
 * HelpTip — an inline ? icon that shows a tooltip on hover/focus/tap.
 *
 * Usage:
 *   <HelpTip text="Kill/Death ratio — kills divided by deaths." />
 *
 * Props:
 *   text      — the tooltip string (required)
 *   position  — 'top' (default) | 'bottom'
 */
export default function HelpTip({ text, position = 'top' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click (handles mobile tap-away)
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open])

  const isAbove = position === 'top'

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      // Desktop: open on hover
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Mobile: toggle on tap
      onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
      // Keyboard: open on focus
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {/* The ? icon */}
      <span
        tabIndex={0}
        role="button"
        aria-label="Help"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[9px] font-bold leading-none cursor-help select-none transition-colors
          ${open
            ? 'border-siege-accent text-siege-accent bg-siege-accent/10'
            : 'border-siege-muted/50 text-siege-muted hover:border-siege-accent hover:text-siege-accent'
          }`}
      >
        ?
      </span>

      {/* Tooltip popover */}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 w-52 rounded-lg border border-siege-border bg-siege-surface shadow-lg px-3 py-2 text-xs text-gray-300 leading-relaxed pointer-events-none
            left-1/2 -translate-x-1/2
            ${isAbove ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {/* Arrow */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-siege-surface border-siege-border rotate-45
              ${isAbove
                ? 'bottom-[-5px] border-r border-b'
                : 'top-[-5px] border-l border-t'
              }`}
          />
          {text}
        </span>
      )}
    </span>
  )
}
