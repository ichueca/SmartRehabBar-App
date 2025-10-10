import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import ActiveSession from './pages/ActiveSession'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="active-session/:id" element={<ActiveSession />} />
        </Route>
      </Routes>
    </SocketProvider>
  )
}

export default App

