import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { patientsAPI, sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import SessionSimulator from '../components/SessionSimulator'
import { getBalanceLevel } from '../utils/balanceUtils'

const Dashboard = () => {
  const navigate = useNavigate()
  const { connected, measurements } = useSocket()
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSessions: 0,
    totalSessions: 0,
    todayMeasurements: 0
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const handleSessionStarted = (session) => {
    // Navegar a la sesión activa cuando se inicia la simulación
    navigate(`/active-session/${session.id}`)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [patients, sessions] = await Promise.all([
        patientsAPI.getAll(),
        sessionsAPI.getAll()
      ])
      
      const activeSessions = sessions.filter(s => !s.endTime)
      const recentSessions = sessions.slice(0, 5)
      
      setStats({
        totalPatients: patients.length,
        activeSessions: activeSessions.length,
        totalSessions: sessions.length,
        todayMeasurements: measurements.length
      })
      
      setRecentSessions(recentSessions)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Vista general del sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <SessionSimulator onSessionStarted={handleSessionStarted} />
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Tiempo Real Activo' : 'Sin Conexión'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pacientes"
          value={stats.totalPatients}
          icon="👥"
          color="text-blue-600"
        />
        <StatCard
          title="Sesiones Activas"
          value={stats.activeSessions}
          icon="🟢"
          color="text-green-600"
        />
        <StatCard
          title="Total Sesiones"
          value={stats.totalSessions}
          icon="📋"
          color="text-purple-600"
        />
        <StatCard
          title="Mediciones Hoy"
          value={measurements.length}
          icon="📊"
          color="text-orange-600"
        />
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Sesiones Recientes</h3>
          <Link to="/sessions" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todas →
          </Link>
        </div>
        
        {recentSessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay sesiones registradas</p>
        ) : (
          <div className="space-y-3">
            {recentSessions.map(session => (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {session.patient?.name || 'Paciente desconocido'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(session.startTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.endTime
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {session.endTime ? 'Finalizada' : 'Activa'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Measurements */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Mediciones en Tiempo Real
          {measurements.length > 10 && (
            <span className="text-sm text-gray-500 ml-2">(mostrando últimas 10 de {measurements.length})</span>
          )}
        </h3>

        {measurements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Esperando mediciones... {connected ? '🟢' : '🔴'}
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {measurements.slice(0, 10).map((measurement, index) => {
              // Determinar color según balance
              let balanceInfo = null
              if (measurement.paired && measurement.balance) {
                balanceInfo = getBalanceLevel(measurement.balance.difference)
              }

              return (
                <div key={index} className={`p-3 rounded-lg border ${
                  measurement.paired && balanceInfo
                    ? `${balanceInfo.bgClass} ${balanceInfo.borderClass}`
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {measurement.paired ? (
                          <>
                            {balanceInfo?.icon} Emparejada
                          </>
                        ) : (
                          `👟 ${measurement.foot === 'left' ? 'Izquierda' : 'Derecha'}`
                        )}
                      </span>
                      {measurement.paired && (
                        <span className="ml-3 text-sm text-gray-600">
                          Izq: {measurement.left.weight}kg | Der: {measurement.right.weight}kg
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(), 'HH:mm:ss')}
                    </span>
                  </div>
                  {measurement.paired && measurement.balance && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${measurement.balance.leftPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {measurement.balance.leftPercentage}% / {measurement.balance.rightPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Descompensación:</span>
                        <span className={`text-xs font-bold ${balanceInfo.textClass}`}>
                          {measurement.balance.difference.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

