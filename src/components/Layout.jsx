import { Outlet, NavLink, useLocation } from 'react-router-dom'
import metaData from '../data/meta.json'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/players', label: 'Roster', icon: '👤' },
  { to: '/maps', label: 'Maps', icon: '🗺' },
  { to: '/session-prep', label: 'Session Prep', icon: '▶' },
]

export default function Layout() {
  const parsedAt = new Date(metaData.parsedAt)
  const formatted = parsedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-siege-surface border-b border-siege-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-siege-accent font-bold text-lg tracking-widest uppercase">Eh_</span>
            <span className="text-white font-semibold">R6 Coach</span>
            <span className="text-siege-muted text-xs hidden sm:block">Rainbow Six Siege · Coaching Dashboard</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-siege-accent/20 text-siege-accent font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-xs">{icon}</span>
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-siege-border py-3 px-4 text-center text-xs text-siege-muted">
        KB last parsed: {formatted} · {metaData.mapCount} maps · {metaData.stratCount} strats · {metaData.playerCount} players tracked
      </footer>
    </div>
  )
}
