import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

const Layout = () => {
  const location = useLocation()
  const { connected } = useSocket()
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  
  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/patients', label: 'Pacientes', icon: '👥' },
    { path: '/sessions', label: 'Sesiones', icon: '📋' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏥</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SmartRehabBar</h1>
                <p className="text-sm text-gray-500">Sistema de Rehabilitación Inteligente</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
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
                <span>{link.icon}</span>
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

