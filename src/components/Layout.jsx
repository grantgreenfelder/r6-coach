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
          {/* Desktop nav — hidden on mobile (bottom nav used instead) */}
          <nav className="hidden sm:flex items-center gap-1">
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
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content — extra bottom padding on mobile for the bottom nav */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        <Outlet />
      </main>

      {/* Footer — hidden on mobile */}
      <footer className="hidden sm:block border-t border-siege-border py-3 px-4 text-center text-xs text-siege-muted">
        KB last parsed: {formatted} · {metaData.mapCount} maps · {metaData.stratCount} strats · {metaData.playerCount} players tracked
      </footer>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-siege-surface border-t border-siege-border flex">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? 'text-siege-accent' : 'text-gray-500'
              }`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
