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
  const [align, setAlign] = useState('center') // 'left' | 'center' | 'right'
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

  // Edge-aware: align the ~176px tooltip inward when the icon is near a screen
  // edge. Measured at open time (in the handler, not an effect).
  function openTip() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const half = 90, margin = 8
      setAlign(center - half < margin ? 'left' : center + half > window.innerWidth - margin ? 'right' : 'center')
    }
    setOpen(true)
  }

  const isAbove = position === 'top'
  const alignCls = align === 'left'  ? 'left-0'
                 : align === 'right' ? 'right-0'
                 :                     'left-1/2 -translate-x-1/2'
  const arrowCls = align === 'left'  ? 'left-2'
                 : align === 'right' ? 'right-2'
                 :                     'left-1/2 -translate-x-1/2'

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      // Desktop: open on hover
      onMouseEnter={openTip}
      onMouseLeave={() => setOpen(false)}
      // Mobile: toggle on tap
      onClick={e => { e.preventDefault(); e.stopPropagation(); open ? setOpen(false) : openTip() }}
      // Keyboard: open on focus
      onFocus={openTip}
      onBlur={() => setOpen(false)}
    >
      {/* The ? icon */}
      <span
        tabIndex={0}
        role="button"
        aria-label="Help"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-3 h-3 rounded-full border text-[8px] font-bold leading-none cursor-help select-none transition-colors
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
          className={`absolute z-50 w-44 max-w-[calc(100vw-1rem)] rounded-lg border border-siege-border bg-siege-surface shadow-lg px-3 py-2 text-xs text-gray-300 leading-relaxed pointer-events-none
            ${alignCls}
            ${isAbove ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {/* Arrow */}
          <span
            className={`absolute ${arrowCls} w-2 h-2 bg-siege-surface border-siege-border rotate-45
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
