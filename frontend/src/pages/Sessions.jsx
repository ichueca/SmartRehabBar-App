import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { getBalanceLevel } from '../utils/balanceUtils'

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
            const sessionType = hasSitToStand ? '🪑 Levantarse' : '🚶 Pisadas'
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
                        {sessionType}
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
                          {balanceInfo.icon} {balanceInfo.label}
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
                    <div className="text-2xl">
                      {session.endTime ? (balanceInfo ? balanceInfo.icon : '📋') : '🟢'}
                    </div>
                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar sesión"
                    >
                      🗑️
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

