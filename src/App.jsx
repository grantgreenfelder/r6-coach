import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Component, Suspense, lazy, cloneElement } from 'react'
import Layout from './components/Layout.jsx'
import PageSkeleton from './components/PageSkeleton.jsx'

const NotFound       = lazy(() => import('./pages/NotFound.jsx'))
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'))
const Players        = lazy(() => import('./pages/Players.jsx'))
const PlayerDetail   = lazy(() => import('./pages/PlayerDetail.jsx'))
const Maps           = lazy(() => import('./pages/Maps.jsx'))
const MapDetail      = lazy(() => import('./pages/MapDetail.jsx'))
const Operators      = lazy(() => import('./pages/Operators.jsx'))
const OperatorDetail = lazy(() => import('./pages/OperatorDetail.jsx'))

// Forces component remount when route params change, resetting all internal state.
function KeyedByParams({ fallback, children }) {
  const params = useParams()
  const key = Object.values(params).join('/')
  return (
    <Suspense fallback={fallback}>
      {cloneElement(children, { key })}
    </Suspense>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[R6Coach] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-siege-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-4xl">💥</div>
            <h1 className="text-white text-xl font-bold">Something went wrong</h1>
            <p className="text-siege-muted text-sm leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-siege-accent text-siege-bg rounded text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-siege-bg"><PageSkeleton page="generic" /></div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Suspense fallback={<PageSkeleton page="dashboard" />}><Dashboard /></Suspense>} />
              <Route path="players" element={<Suspense fallback={<PageSkeleton />}><Players /></Suspense>} />
              <Route path="players/:name" element={<KeyedByParams fallback={<PageSkeleton page="detail" />}><PlayerDetail /></KeyedByParams>} />
              <Route path="maps" element={<Suspense fallback={<PageSkeleton />}><Maps /></Suspense>} />
              <Route path="maps/:mapName" element={<KeyedByParams fallback={<PageSkeleton page="detail" />}><MapDetail /></KeyedByParams>} />
              <Route path="operators" element={<Suspense fallback={<PageSkeleton />}><Operators /></Suspense>} />
              <Route path="operators/:name" element={<KeyedByParams fallback={<PageSkeleton page="detail" />}><OperatorDetail /></KeyedByParams>} />
              <Route path="compare" element={<Navigate to="/players" replace />} />
              <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
