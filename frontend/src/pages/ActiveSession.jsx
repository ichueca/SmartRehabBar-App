import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionsAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { getBalanceLevel } from '../utils/balanceUtils'

const ActiveSession = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { connected, measurements: socketMeasurements } = useSocket()
  const [session, setSession] = useState(null)
  const [sessionMeasurements, setSessionMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadSession()
  }, [id])

  // Escuchar mediciones en tiempo real
  useEffect(() => {
    if (socketMeasurements.length > 0) {
      const latestMeasurement = socketMeasurements[0]
      // Solo agregar si pertenece a esta sesión
      if (latestMeasurement.sessionId === parseInt(id) || 
          latestMeasurement.left?.sessionId === parseInt(id)) {
        setSessionMeasurements(prev => [latestMeasurement, ...prev])
      }
    }
  }, [socketMeasurements, id])

  const loadSession = async () => {
    try {
      setLoading(true)
      const data = await sessionsAPI.getById(id)
      setSession(data)
    } catch (error) {
      console.error('Error loading session:', error)
      alert('Error al cargar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    try {
      await sessionsAPI.end(id, notes)
      // Recargar la sesión para actualizar el estado
      await loadSession()
      setShowEndModal(false)
      setNotes('')
    } catch (error) {
      // Si la sesión ya está finalizada, solo recargar (no es un error real)
      if (error.response?.status === 400 && error.response?.data?.message?.includes('finalizada')) {
        console.log('La sesión ya estaba finalizada, recargando...')
        await loadSession()
        setShowEndModal(false)
        setNotes('')
      } else {
        console.error('Error ending session:', error)
        alert('Error al finalizar sesión')
      }
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando sesión...</div>
  }

  if (!session) {
    return <div className="text-center py-12">Sesión no encontrada</div>
  }

  const duration = Math.round((new Date() - new Date(session.startTime)) / 60000)
  
  // Calcular estadísticas en tiempo real
  const pairedMeasurements = sessionMeasurements.filter(m => m.paired)
  const totalSteps = pairedMeasurements.length
  
  let avgBalance = null
  if (pairedMeasurements.length > 0) {
    const totalLeft = pairedMeasurements.reduce((sum, m) => sum + m.left.weight, 0)
    const totalRight = pairedMeasurements.reduce((sum, m) => sum + m.right.weight, 0)
    const avgLeft = totalLeft / pairedMeasurements.length
    const avgRight = totalRight / pairedMeasurements.length
    const total = avgLeft + avgRight
    const leftPercentage = (avgLeft / total) * 100
    const rightPercentage = (avgRight / total) * 100

    // Calcular el promedio de las diferencias individuales (no la diferencia de los promedios)
    const totalDifference = pairedMeasurements.reduce((sum, m) => {
      const stepTotal = m.left.weight + m.right.weight
      const stepLeftPct = (m.left.weight / stepTotal) * 100
      const stepRightPct = (m.right.weight / stepTotal) * 100
      return sum + Math.abs(stepLeftPct - stepRightPct)
    }, 0)
    const avgDifference = totalDifference / pairedMeasurements.length

    avgBalance = {
      leftWeight: avgLeft,
      rightWeight: avgRight,
      leftPercentage: leftPercentage.toFixed(1),
      rightPercentage: rightPercentage.toFixed(1),
      difference: avgDifference
    }
  }

  // Datos para gráficos - ventana deslizante de las últimas 20
  const last20Measurements = pairedMeasurements.slice(0, 20).reverse()
  const startIndex = Math.max(1, totalSteps - 19) // Índice de inicio para mostrar números reales
  const balanceChartData = last20Measurements.map((m, index) => ({
    index: `#${startIndex + index}`,
    izquierdo: m.left.weight,
    derecho: m.right.weight
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sesión en Curso</h2>
          <p className="text-gray-600 mt-1">
            {session.patient?.name || 'Paciente desconocido'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Tiempo Real' : 'Desconectado'}
            </span>
          </div>
          {!session.endTime ? (
            <button
              onClick={() => setShowEndModal(true)}
              className="btn-danger"
            >
              🛑 Finalizar Sesión
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                ✅ Sesión Finalizada
              </div>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                🏠 Volver al Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Stats */}
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
          <p className="text-3xl font-bold text-purple-900">{sessionMeasurements.length}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-orange-600 mb-1">Inicio</p>
          <p className="text-xl font-bold text-orange-900">
            {format(new Date(session.startTime), "HH:mm", { locale: es })}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Izquierdo</p>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-300"
                      style={{ width: `${avgBalance.leftPercentage}%` }}
                    >
                      <span className="text-white font-bold text-sm">{avgBalance.leftPercentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Derecho</p>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-300"
                      style={{ width: `${avgBalance.rightPercentage}%` }}
                    >
                      <span className="text-white font-bold text-sm">{avgBalance.rightPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center space-y-2">
              <div>
                <p className="text-sm text-gray-600">Peso Izq.</p>
                <p className="text-2xl font-bold text-blue-600">{avgBalance.leftWeight.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Peso Der.</p>
                <p className="text-2xl font-bold text-green-600">{avgBalance.rightWeight.toFixed(1)} kg</p>
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
            {totalSteps > 20 && (
              <span className="text-sm text-gray-500 ml-2 font-normal">
                (mostrando últimas 20 de {totalSteps} pisadas)
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

      {/* Mediciones en Tiempo Real */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">
          Mediciones en Tiempo Real
          {sessionMeasurements.length > 10 && (
            <span className="text-sm text-gray-500 ml-2">(mostrando últimas 10 de {sessionMeasurements.length})</span>
          )}
        </h3>
        {sessionMeasurements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">Esperando mediciones...</p>
            <div className={`w-4 h-4 rounded-full mx-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessionMeasurements.slice(0, 10).map((measurement, index) => {
              // Determinar color según balance
              let balanceInfo = null
              if (measurement.paired && measurement.balance) {
                balanceInfo = getBalanceLevel(measurement.balance.difference)
              }

              return (
                <div key={index} className={`p-4 rounded-lg border ${
                  measurement.paired && balanceInfo
                    ? `${balanceInfo.bgClass} ${balanceInfo.borderClass}`
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {measurement.paired ? (
                          <>
                            {balanceInfo?.icon} Pisada Completa
                          </>
                        ) : (
                          `👟 ${measurement.foot === 'left' ? 'Pie Izquierdo' : 'Pie Derecho'}`
                        )}
                      </span>
                      {measurement.paired && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="mr-4">Izq: <strong>{measurement.left.weight}kg</strong></span>
                          <span>Der: <strong>{measurement.right.weight}kg</strong></span>
                        </div>
                      )}
                    </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(), 'HH:mm:ss')}
                  </span>
                </div>
                {measurement.paired && measurement.balance && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${measurement.balance.leftPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
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

      {/* Modal Finalizar Sesión */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Finalizar Sesión</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de finalizar esta sesión? Se guardarán todas las mediciones registradas.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre la sesión..."
              ></textarea>
            </div>
            
            <div className="flex space-x-3">
              <button onClick={handleEndSession} className="flex-1 btn-danger">
                Finalizar Sesión
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveSession

