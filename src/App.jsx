import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Players from './pages/Players.jsx'
import PlayerDetail from './pages/PlayerDetail.jsx'
import Maps from './pages/Maps.jsx'
import MapDetail from './pages/MapDetail.jsx'
import StratViewer from './pages/StratViewer.jsx'
import SessionPrep from './pages/SessionPrep.jsx'
import Operators from './pages/Operators.jsx'
import OperatorDetail from './pages/OperatorDetail.jsx'

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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="players" element={<Players />} />
            <Route path="players/:name" element={<PlayerDetail />} />
            <Route path="maps" element={<Maps />} />
            <Route path="maps/:mapName" element={<MapDetail />} />
            <Route path="maps/:mapName/:side/:site" element={<StratViewer />} />
            <Route path="session-prep" element={<SessionPrep />} />
            <Route path="operators" element={<Operators />} />
            <Route path="operators/:name" element={<OperatorDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
