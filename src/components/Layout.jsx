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
}

const navItems = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Home', icon: Icons.dashboard },
  { to: '/players', label: 'Roster', mobileLabel: 'Roster', icon: Icons.roster },
  { to: '/maps', label: 'Maps', mobileLabel: 'Maps', icon: Icons.maps },
  { to: '/operators', label: 'Operators', mobileLabel: 'Ops', icon: Icons.operators },
]

function mobilePageTitle(pathname) {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/players/')) return 'Player'
  if (pathname === '/players') return 'Roster'
  if (pathname.startsWith('/maps/')) return 'Map'
  if (pathname.startsWith('/operators/')) return 'Operator'
  if (pathname === '/operators') return 'Operators'
  return 'DOE · R6'
}

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* Top nav */}
      <header className="bg-siege-surface border-b border-siege-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14">
          {/* Wordmark */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/doe-seal.png"
              alt="Department of Eh"
              className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-doe-gold/30"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-white font-bold text-sm tracking-wider uppercase leading-none">Department of Eh</span>
              <span className="text-siege-accent text-[10px] font-semibold tracking-widest uppercase leading-none mt-0.5">R6 Division</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-siege-border ml-1">
              <span className="text-siege-muted text-xs">Rainbow Six Siege · Gaming Services</span>
            </div>
          </div>

          {/* Mobile: centered page title */}
          <div className="sm:hidden flex-1 flex flex-col items-center leading-tight">
            <span className="text-white font-semibold text-sm leading-none">{mobilePageTitle(location.pathname)}</span>
            <span className="text-siege-accent text-[9px] font-semibold tracking-widest uppercase leading-none mt-0.5">DOE · R6</span>
          </div>

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
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        <Outlet />
      </main>

      {/* Footer — hidden on mobile */}
      <footer className="hidden sm:block border-t border-siege-border py-3 px-4 text-center text-xs text-siege-muted">
        Department of Eh · Gaming Services · R6 Division
        <span className="mx-2">·</span>
        {metaData.mapCount} maps · {metaData.playerCount} players · {metaData.operatorCount || 0} operators
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
