import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

const LayoutIcon = ({ type, className = 'w-5 h-5' }) => {
  const commonProps = { className, fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', viewBox: '0 0 24 24' }

  const icons = {
    brand: <svg {...commonProps}><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>,
    dashboard: <svg {...commonProps}><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" fill="currentColor" stroke="none" /><rect x="12" y="8" width="3" height="8" fill="currentColor" stroke="none" /><rect x="17" y="6" width="3" height="10" fill="currentColor" stroke="none" /></svg>,
    patients: <svg {...commonProps}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="3.5" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" /></svg>,
    sessions: <svg {...commonProps}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>
  }

  return icons[type] || null
}

const Layout = () => {
  const location = useLocation()
  const { connected, activeSessions } = useSocket()
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }

    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/patients', label: 'Pacientes', icon: 'patients' },
    { path: '/sessions', label: 'Sesiones', icon: 'sessions' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="text-gray-900"><LayoutIcon type="brand" className="w-10 h-10" /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SmartRehabBar</h1>
                <p className="text-sm text-gray-500">Sistema de Rehabilitación Inteligente</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-6">
              {/* Active Sessions Indicator */}
              {activeSessions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="block h-4 w-4 rounded-full bg-green-500"></span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeSessions.length}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-green-700">
                      {activeSessions.length} Sesión{activeSessions.length > 1 ? 'es' : ''} Activa{activeSessions.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      {activeSessions.slice(0, 2).map(session => (
                        <Link
                          key={session.id}
                          to={`/active-session/${session.id}`}
                          className="block hover:text-green-600 underline"
                        >
                          {session.patient?.name || 'Paciente desconocido'}
                        </Link>
                      ))}
                      {activeSessions.length > 2 && (
                        <Link
                          to="/sessions"
                          className="block hover:text-green-600 underline"
                        >
                          +{activeSessions.length - 2} más...
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center space-x-2 py-4 px-3 border-b-2 text-sm font-medium transition-colors
                  ${isActive(link.path)
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span><LayoutIcon type={link.icon} className="w-4 h-4" /></span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 SmartRehabBar - Sistema de Rehabilitación
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout

