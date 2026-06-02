import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { getBalanceLevel } from '../utils/balanceUtils'

const SessionsIcon = ({ type, className = 'w-5 h-5' }) => {
  const commonProps = { className, fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', viewBox: '0 0 24 24' }

  const icons = {
    steps: <svg {...commonProps}><path d="M9 6c1.2 0 2 1.2 2 2.6 0 1.7-1 3.4-2.1 4.9-.7 1-1.2 2.3-1.2 3.5V20H5.5v-2.4c0-1.5.6-3 1.5-4.2.9-1.2 1.8-2.8 1.8-4.5C8.8 7.5 8.9 6 9 6Zm6 0c1.2 0 2 1.2 2 2.6 0 1.7-1 3.4-2.1 4.9-.7 1-1.2 2.3-1.2 3.5V20h-2.2v-2.4c0-1.5.6-3 1.5-4.2.9-1.2 1.8-2.8 1.8-4.5 0-1.4.1-2.9.2-2.9Z" fill="currentColor" stroke="none" /></svg>,
    stand: <svg {...commonProps}><circle cx="12" cy="5" r="2" /><path d="M12 7v6" /><path d="M12 10l-4 3" /><path d="M12 10l4 3" /><path d="M12 13l-3 6" /><path d="M12 13l3 6" /></svg>,
    session: <svg {...commonProps}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>,
    delete: <svg {...commonProps}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
  }

  return icons[type] || null
}

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all') // all, active, completed
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await sessionsAPI.getAll()
      setSessions(data)
    } catch (error) {
      console.error('Error loading sessions:', error)
      alert('Error al cargar sesiones')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId, e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await sessionsAPI.delete(sessionId)
      // Recargar sesiones después de eliminar
      await loadSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Error al eliminar sesión')
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'active') return !session.endTime
    if (filter === 'completed') return session.endTime
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando sesiones...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Sesiones</h2>
        <p className="text-gray-600 mt-1">Historial de sesiones de rehabilitación</p>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas ({sessions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Activas ({sessions.filter(s => !s.endTime).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Finalizadas ({sessions.filter(s => s.endTime).length})
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay sesiones {filter === 'active' ? 'activas' : filter === 'completed' ? 'finalizadas' : 'registradas'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => {
            // Obtener color según balance si la sesión está finalizada
            let balanceInfo = null
            if (session.endTime && session.statistics?.averageBalance) {
              balanceInfo = getBalanceLevel(session.statistics.averageBalance.difference)
            }

            // Determinar tipo de sesión
            const hasSitToStand = session.sitToStandSessions && session.sitToStandSessions.length > 0
            const hasSteps = session.measurements && session.measurements.length > 0
            const sessionType = hasSitToStand ? 'Levantarse' : 'Pisadas'
            const sessionTypeColor = hasSitToStand ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'

            return (
              <div
                key={session.id}
                className={`card hover:shadow-lg transition-shadow ${
                  balanceInfo ? `border-l-4 ${balanceInfo.borderClass}` : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Sesión #{session.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${sessionTypeColor}`}>
                        <span className="inline-flex items-center space-x-1"><SessionsIcon type={hasSitToStand ? 'stand' : 'steps'} className="w-3.5 h-3.5" /><span>{sessionType}</span></span>
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.endTime
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700 animate-pulse'
                      }`}>
                        {session.endTime ? 'Finalizada' : 'En Curso'}
                      </span>
                      {balanceInfo && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${balanceInfo.bgClass} ${balanceInfo.textClass}`}>
                          <span className="inline-flex items-center space-x-1"><span className={`inline-block h-2.5 w-2.5 rounded-full ${balanceInfo.color === 'green' ? 'bg-green-500' : balanceInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span><span>{balanceInfo.label}</span></span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">Paciente</p>
                        <p className="font-medium">{session.patient?.name || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inicio</p>
                        <p className="font-medium">
                          {format(new Date(session.startTime), "d/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      {session.endTime && (
                        <div>
                          <p className="text-sm text-gray-600">Duración</p>
                          <p className="font-medium">
                            {Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)} minutos
                          </p>
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-sm text-gray-600 mt-3">
                        <span className="font-medium">Notas:</span> {session.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <div className="text-gray-500">
                      {session.endTime ? (
                        balanceInfo ? (
                          <span className={`inline-block h-3.5 w-3.5 rounded-full ${balanceInfo.color === 'green' ? 'bg-green-500' : balanceInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        ) : (
                          <SessionsIcon type="session" className="w-5 h-5" />
                        )
                      ) : (
                        <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-500"></span>
                      )}
                    </div>
                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar sesión"
                    >
                      <SessionsIcon type="delete" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Sessions

