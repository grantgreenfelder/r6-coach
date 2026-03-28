import { Link } from 'react-router-dom'

/**
 * Full-page "not found" state for detail pages.
 * Props: icon (emoji), title, message, backTo (path), backLabel
 */
export function NotFound({ icon = '?', title, message, backTo, backLabel }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 space-y-4">
      <div className="w-16 h-16 rounded-full bg-siege-card border border-siege-border flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-lg">{title}</p>
        {message && <p className="text-siege-muted text-sm mt-1">{message}</p>}
      </div>
      {backTo && (
        <Link
          to={backTo}
          className="text-siege-accent hover:underline text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siege-accent rounded"
        >
          ← {backLabel || 'Go back'}
        </Link>
      )}
    </div>
  )
}

/**
 * Inline empty state for sections within a page.
 * Props: message
 */
export function EmptySection({ message = 'No data available.' }) {
  return (
    <p className="text-siege-muted text-sm italic py-4 text-center">{message}</p>
  )
}
