import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
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
  )
}
