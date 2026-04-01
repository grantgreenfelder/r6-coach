import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-5">
      {/* Hex icon */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <polygon
          points="28,2 52,15 52,41 28,54 4,41 4,15"
          fill="none"
          stroke="#e8a020"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
        <text x="28" y="35" textAnchor="middle" fontSize="22" fontWeight="800"
          fontFamily="system-ui, sans-serif" fill="#e8a020" fillOpacity="0.7">
          404
        </text>
      </svg>

      <div className="space-y-2">
        <h1 className="text-white text-2xl font-bold">Page not found</h1>
        <p className="text-siege-muted text-sm max-w-xs leading-relaxed">
          <code className="text-siege-accent/80 font-mono text-xs bg-siege-card border border-siege-border rounded px-1.5 py-0.5">
            {pathname}
          </code>
          {' '}doesn't exist in the coaching dashboard.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="px-4 py-2 bg-siege-accent text-siege-bg text-sm font-semibold rounded hover:opacity-90 transition-opacity"
        >
          Dashboard
        </Link>
        <Link
          to="/maps"
          className="px-4 py-2 border border-siege-border text-siege-muted text-sm rounded hover:text-white hover:border-siege-muted transition-colors"
        >
          Maps
        </Link>
        <Link
          to="/players"
          className="px-4 py-2 border border-siege-border text-siege-muted text-sm rounded hover:text-white hover:border-siege-muted transition-colors"
        >
          Roster
        </Link>
      </div>
    </div>
  )
}
