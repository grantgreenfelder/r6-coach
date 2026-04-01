import { Outlet, NavLink, useLocation } from 'react-router-dom'
import metaData from '../data/meta.json'
import GlobalSearch from './GlobalSearch.jsx'

// ─── SVG Nav Icons ────────────────────────────────────────────────────────────
// Clean inline SVGs — consistent rendering across all platforms

const Icons = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  ),
  roster: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="8" cy="5" r="2.5" />
      <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  ),
  maps: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1.5 3.5l4-1.5 5 2 4-2v10l-4 2-5-2-4 1.5z" />
      <line x1="5.5" y1="2" x2="5.5" y2="13.5" />
      <line x1="10.5" y1="4" x2="10.5" y2="13.5" />
    </svg>
  ),
  operators: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="8" y1="11" x2="8" y2="14" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="11" y1="8" x2="14" y2="8" />
    </svg>
  ),
  sessionPrep: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 3h10M3 7h6M3 11h8" />
      <path d="M11 9.5l3 2-3 2z" fill="currentColor" stroke="none" />
    </svg>
  ),
}

const navItems = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Home', icon: Icons.dashboard },
  { to: '/players', label: 'Roster', mobileLabel: 'Roster', icon: Icons.roster },
  { to: '/maps', label: 'Maps', mobileLabel: 'Maps', icon: Icons.maps },
  { to: '/operators', label: 'Operators', mobileLabel: 'Ops', icon: Icons.operators },
  { to: '/session-prep', label: 'Session Prep', mobileLabel: 'Prep', icon: Icons.sessionPrep },
]

// Map pathnames to short labels for the mobile header
function mobilePageTitle(pathname) {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/players/')) return 'Player'
  if (pathname === '/players') return 'Roster'
  if (pathname.startsWith('/maps/') && pathname.split('/').length === 5) return 'Strat'
  if (pathname.startsWith('/maps/')) return 'Map'
  if (pathname.startsWith('/operators/')) return 'Operator'
  if (pathname === '/operators') return 'Operators'
  if (pathname === '/session-prep') return 'Session Prep'
  return 'R6 Coach'
}

export default function Layout() {
  const location = useLocation()
  const parsedAt = new Date(metaData.parsedAt)
  const now = new Date()
  const daysSince = Math.floor((now - parsedAt) / (1000 * 60 * 60 * 24))
  const formatted = parsedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const dateColor = daysSince > 14 ? 'text-red-400' : daysSince > 7 ? 'text-yellow-400' : 'text-siege-muted'
  const datePrefix = daysSince > 7 ? '⚠ ' : ''

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-siege-surface border-b border-siege-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Hex icon — pointed-top hexagon, matches R6 visual language */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <polygon
                points="14,1 26,7.5 26,20.5 14,27 2,20.5 2,7.5"
                fill="#e8a020"
                stroke="#e8a020"
                strokeWidth="0"
              />
              <text
                x="14" y="18"
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.5"
                fill="#1c1c1c"
              >EH</text>
            </svg>
            <span className="text-siege-accent font-bold text-base tracking-widest uppercase leading-none">Eh_</span>
            <span className="text-white font-semibold hidden sm:block">R6 Coach</span>
            <span className="text-siege-muted text-xs hidden lg:block">Rainbow Six Siege · Coaching Dashboard</span>
          </div>

          {/* Mobile: centered page title */}
          <span className="sm:hidden flex-1 text-center text-white font-semibold text-sm">
            {mobilePageTitle(location.pathname)}
          </span>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1 ml-auto">
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
                <span aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="ml-2 pl-2 border-l border-siege-border">
              <GlobalSearch />
            </div>
          </nav>

          {/* Mobile search button */}
          <div className="sm:hidden ml-auto">
            <GlobalSearch />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        <Outlet />
      </main>

      {/* Footer — hidden on mobile */}
      <footer className="hidden sm:block border-t border-siege-border py-3 px-4 text-center text-xs">
        <span className={dateColor}>{datePrefix}KB last parsed: {formatted}</span>
        <span className="text-siege-muted"> · {metaData.mapCount} maps · {metaData.stratCount} strats · {metaData.playerCount} players · {metaData.operatorCount || 77} operators tracked</span>
      </footer>

      {/* Mobile bottom nav */}
      <nav aria-label="Mobile navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-siege-surface border-t border-siege-border flex">
        {navItems.map(({ to, label, mobileLabel, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? 'text-siege-accent' : 'text-gray-500'
              }`
            }
          >
            <span aria-hidden="true">{icon}</span>
            <span className="text-[11px] font-medium leading-none mt-0.5">{mobileLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
