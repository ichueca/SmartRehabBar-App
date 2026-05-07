import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { patientsAPI, sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import HardwareSessionStarter from '../components/HardwareSessionStarter'
import SitToStandStarter from '../components/SitToStandStarter'
import BatteryIndicator from '../components/BatteryIndicator'
import { getBalanceLevel } from '../utils/balanceUtils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const Dashboard = () => {
  const navigate = useNavigate()
  const { connected, measurements, batteryLevels } = useSocket()
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSessions: 0,
    totalSessions: 0,
    todayMeasurements: 0
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState(null)
  const [showActiveSession, setShowActiveSession] = useState(false)

  const handleSessionStarted = (session) => {
    // Navegar a la sesión activa cuando se inicia la simulación
    navigate(`/active-session/${session.id}`)
  }

  const handleSitToStandStarted = (sitToStandSession) => {
    // Navegar a la vista de sit-to-stand cuando se inicia
    navigate(`/sit-to-stand/${sitToStandSession.id}`)
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres finalizar la sesión de ${activeSession.patient?.name}?`
    )

    if (confirmed) {
      try {
        await sessionsAPI.end(activeSession.id, 'Sesión finalizada desde el Dashboard')
        // Recargar datos del dashboard
        await loadDashboardData()
      } catch (error) {
        console.error('Error ending session:', error)
        alert('Error al finalizar la sesión')
      }
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Escuchar eventos de Socket.IO para actualizar la sesión activa
  useEffect(() => {
    if (showActiveSession && activeSession) {
      // Recargar la sesión activa cuando lleguen nuevas mediciones
      const reloadActiveSession = async () => {
        try {
          const updatedSession = await sessionsAPI.getById(activeSession.id)
          setActiveSession(updatedSession)
        } catch (error) {
          console.error('Error reloading active session:', error)
        }
      }

      // Recargar cuando lleguen nuevas mediciones
      if (measurements.length > 0) {
        reloadActiveSession()
      }
    }
  }, [measurements, showActiveSession, activeSession?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [patients, sessions, activeSessions] = await Promise.all([
        patientsAPI.getAll(),
        sessionsAPI.getAll(),
        sessionsAPI.getActive()
      ])

      // Si hay una sesión activa, cargar sus detalles
      if (activeSessions.length > 0) {
        const activeSessionDetails = await sessionsAPI.getById(activeSessions[0].id)
        setActiveSession(activeSessionDetails)
        setShowActiveSession(true)
      } else {
        setActiveSession(null)
        setShowActiveSession(false)
      }

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

  const renderActiveSession = () => {
    if (!activeSession) return null

    const duration = Math.round((new Date() - new Date(activeSession.startTime)) / 60000)

    // Calcular estadísticas en tiempo real
    const pairedMeasurements = activeSession.measurements?.filter(m => m.pairedMeasurementId !== null) || []
    const totalSteps = Math.floor(pairedMeasurements.length / 2)

    let avgBalance = null
    if (totalSteps > 0) {
      const processedPairs = new Set()
      let totalDifference = 0
      let totalLeftWeight = 0
      let totalRightWeight = 0
      let balanceCount = 0

      for (const measurement of pairedMeasurements) {
        if (!processedPairs.has(measurement.id)) {
          const pair = pairedMeasurements.find(m => m.id === measurement.pairedMeasurementId)
          if (pair) {
            const leftWeight = measurement.foot === 'left' ? measurement.weight : pair.weight
            const rightWeight = measurement.foot === 'right' ? measurement.weight : pair.weight
            const total = leftWeight + rightWeight
            const leftPercentage = (leftWeight / total) * 100
            const rightPercentage = (rightWeight / total) * 100
            const difference = Math.abs(leftPercentage - rightPercentage)

            totalDifference += difference
            totalLeftWeight += leftWeight
            totalRightWeight += rightWeight
            balanceCount++

            processedPairs.add(measurement.id)
            processedPairs.add(pair.id)
          }
        }
      }

      if (balanceCount > 0) {
        const avgLeftWeight = totalLeftWeight / balanceCount
        const avgRightWeight = totalRightWeight / balanceCount
        const totalWeight = avgLeftWeight + avgRightWeight
        const leftPercentage = (avgLeftWeight / totalWeight) * 100
        const rightPercentage = (avgRightWeight / totalWeight) * 100
        const avgDifference = totalDifference / balanceCount

        avgBalance = {
          leftWeight: avgLeftWeight,
          rightWeight: avgRightWeight,
          leftPercentage: leftPercentage.toFixed(1),
          rightPercentage: rightPercentage.toFixed(1),
          difference: avgDifference
        }
      }
    }

    // Datos para gráfico - últimas 10 pisadas
    const last10Measurements = []
    const processedPairs = new Set()
    let pairCount = 0

    for (const measurement of pairedMeasurements) {
      if (pairCount >= 10) break
      if (!processedPairs.has(measurement.id)) {
        const pair = pairedMeasurements.find(m => m.id === measurement.pairedMeasurementId)
        if (pair) {
          const leftWeight = measurement.foot === 'left' ? measurement.weight : pair.weight
          const rightWeight = measurement.foot === 'right' ? measurement.weight : pair.weight

          last10Measurements.push({
            index: `#${totalSteps - pairCount}`,
            izquierdo: leftWeight,
            derecho: rightWeight
          })

          processedPairs.add(measurement.id)
          processedPairs.add(pair.id)
          pairCount++
        }
      }
    }

    const balanceChartData = last10Measurements.reverse()

    return (
      <div className="space-y-6">
        {/* Header de Sesión Activa */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sesión en Curso</h2>
            <p className="text-gray-600 mt-1">
              {activeSession.patient?.name || 'Paciente desconocido'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Tiempo Real' : 'Desconectado'}
              </span>
            </div>
            <Link
              to={`/active-session/${activeSession.id}`}
              className="btn-primary"
            >
              Ver Sesión Completa
            </Link>
            <button
              onClick={handleEndSession}
              className="btn-secondary bg-red-600 hover:bg-red-700 text-white"
            >
              Finalizar Sesión
            </button>
          </div>
        </div>

        {/* Estadísticas en tiempo real */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-blue-600 mb-1">Duración</p>
            <p className="text-3xl font-bold text-blue-900">{duration} min</p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-green-600 mb-1">Pisadas</p>
            <p className="text-3xl font-bold text-green-900">{totalSteps}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-sm text-purple-600 mb-1">Mediciones</p>
            <p className="text-3xl font-bold text-purple-900">{activeSession.measurements?.length || 0}</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
            <p className="text-sm text-orange-600 mb-1">Inicio</p>
            <p className="text-xl font-bold text-orange-900">
              {format(new Date(activeSession.startTime), 'HH:mm', { locale: es })}
            </p>
          </div>
        </div>

        {/* Balance en Tiempo Real */}
        {avgBalance && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Balance Promedio</h3>
              {(() => {
                const balanceInfo = getBalanceLevel(avgBalance.difference)
                return (
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${balanceInfo.bgClass} ${balanceInfo.borderClass} border`}>
                    <span className="text-2xl">{balanceInfo.icon}</span>
                    <span className={`font-semibold ${balanceInfo.textClass}`}>
                      {avgBalance.difference.toFixed(1)}% diferencia
                    </span>
                  </div>
                )
              })()}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Izquierdo</p>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${avgBalance.leftPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-blue-600">{avgBalance.leftPercentage}%</span>
                    <span className="text-gray-600">{avgBalance.leftWeight.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Derecho</p>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className="bg-green-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${avgBalance.rightPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-green-600">{avgBalance.rightPercentage}%</span>
                    <span className="text-gray-600">{avgBalance.rightWeight.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico en Tiempo Real */}
        {balanceChartData.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4">
              Evolución del Peso
              {totalSteps > 10 && (
                <span className="text-sm text-gray-500 ml-2 font-normal">
                  (mostrando últimas 10 de {totalSteps} pisadas)
                </span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="izquierdo" fill="#3b82f6" name="Pie Izquierdo" />
                <Bar dataKey="derecho" fill="#10b981" name="Pie Derecho" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mensaje si no hay mediciones */}
        {totalSteps === 0 && (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">Esperando mediciones...</p>
              <div className={`w-4 h-4 rounded-full mx-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  // Si hay una sesión activa, mostrar la vista de sesión activa
  if (showActiveSession && activeSession) {
    return renderActiveSession()
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
          <button onClick={() => navigate('/bipedestation')} className="btn-secondary">
            ⚖️ Bipedestación
          </button>
          <HardwareSessionStarter onSessionStarted={handleSessionStarted} />
          <SitToStandStarter onSitToStandStarted={handleSitToStandStarted} />
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Tiempo Real Activo' : 'Sin Conexión'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
        (batteryLevels.left !== null || batteryLevels.right !== null)
          ? 'lg:grid-cols-5'
          : 'lg:grid-cols-4'
      }`}>
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

        {/* Tarjeta de Batería - solo si hay datos */}
        {(batteryLevels.left !== null || batteryLevels.right !== null) && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado Sensores</p>
                <div className="flex space-x-2 mt-2">
                  <BatteryIndicator level={batteryLevels.left} foot="left" />
                  <BatteryIndicator level={batteryLevels.right} foot="right" />
                </div>
              </div>
              <div className="text-4xl">🔋</div>
            </div>
          </div>
        )}
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
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {measurement.paired ? (
                            <>
                              {balanceInfo?.icon} Emparejada
                            </>
                          ) : (
                            `👟 ${measurement.foot === 'left' ? 'Izquierda' : 'Derecha'}`
                          )}
                        </span>
                        {/* Indicadores de batería */}
                        {measurement.paired ? (
                          <div className="flex space-x-1">
                            <BatteryIndicator level={measurement.left?.batteryLevel} foot="left" />
                            <BatteryIndicator level={measurement.right?.batteryLevel} foot="right" />
                          </div>
                        ) : (
                          <BatteryIndicator level={measurement.measurement?.batteryLevel} foot={measurement.foot} />
                        )}
                      </div>
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

