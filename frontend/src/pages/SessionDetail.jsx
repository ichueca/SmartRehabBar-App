import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { getBalanceLevel } from '../utils/balanceUtils'

const SessionDetail = () => {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [id])

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

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  if (!session) {
    return <div className="text-center py-12">Sesión no encontrada</div>
  }

  // Preparar datos para el gráfico - agrupar mediciones por pares
  const measurements = session.measurements || []
  const pairedMeasurements = []
  const processedIds = new Set()

  measurements.forEach(m => {
    if (processedIds.has(m.id)) return

    if (m.pairedMeasurementId) {
      const pair = measurements.find(p => p.id === m.pairedMeasurementId)
      if (pair) {
        const left = m.foot === 'left' ? m : pair
        const right = m.foot === 'right' ? m : pair

        const total = left.weight + right.weight
        const leftPercentage = (left.weight / total) * 100
        const rightPercentage = (right.weight / total) * 100
        const difference = Math.abs(leftPercentage - rightPercentage)

        pairedMeasurements.push({
          left,
          right,
          balance: {
            leftPercentage,
            rightPercentage,
            difference
          }
        })

        processedIds.add(m.id)
        processedIds.add(pair.id)
      }
    }
  })

  const chartData = pairedMeasurements.map((m, index) => ({
    index: `#${index + 1}`,
    izquierdo: m.left.weight,
    derecho: m.right.weight,
    diferencia: m.balance.difference
  }))

  // Determinar si necesitamos scroll horizontal (>30 pisadas)
  const needsScroll = chartData.length > 30
  const chartWidth = needsScroll ? chartData.length * 40 : '100%'

  const stats = session.statistics || {}
  const duration = session.endTime
    ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
    : Math.round((new Date() - new Date(session.startTime)) / 60000)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/sessions" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Volver a Sesiones
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Sesión #{session.id}</h2>
          <p className="text-gray-600 mt-1">
            {session.patient?.name || 'Paciente desconocido'}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          session.endTime
            ? 'bg-gray-100 text-gray-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {session.endTime ? 'Finalizada' : 'En Curso'}
        </span>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Inicio</p>
          <p className="text-lg font-bold">
            {format(new Date(session.startTime), "HH:mm", { locale: es })}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(session.startTime), "d/MM/yyyy", { locale: es })}
          </p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Duración</p>
          <p className="text-lg font-bold">{duration} min</p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Mediciones</p>
          <p className="text-lg font-bold">{session.measurements?.length || 0}</p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Pisadas</p>
          <p className="text-lg font-bold">{stats.totalSteps || 0}</p>
        </div>
      </div>

      {/* Statistics */}
      {stats.averageBalance && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Estadísticas de Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Balance Promedio</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-primary-600 h-4 rounded-full"
                    style={{ width: `${stats.averageBalance.leftPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {stats.averageBalance.leftPercentage}% / {stats.averageBalance.rightPercentage}%
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Peso Promedio Izquierdo</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.averageBalance.leftWeight.toFixed(1)} kg
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Peso Promedio Derecho</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.averageBalance.rightWeight.toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className={`card ${stats.averageBalance ? getBalanceLevel(stats.averageBalance.difference).bgClass : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Evolución del Peso por Pisada</h3>
            {stats.averageBalance && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getBalanceLevel(stats.averageBalance.difference).borderClass} border bg-white`}>
                <span className="text-xl">{getBalanceLevel(stats.averageBalance.difference).icon}</span>
                <span className={`text-sm font-semibold ${getBalanceLevel(stats.averageBalance.difference).textClass}`}>
                  Balance: {stats.averageBalance.difference.toFixed(1)}% diferencia
                </span>
              </div>
            )}
          </div>
          <div className={needsScroll ? 'overflow-x-auto' : ''}>
            <ResponsiveContainer width={chartWidth} height={350}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  label={{ value: 'Pisada', position: 'insideBottom', offset: -5 }}
                  angle={needsScroll ? -45 : 0}
                  textAnchor={needsScroll ? 'end' : 'middle'}
                  height={needsScroll ? 80 : 60}
                />
                <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-bold mb-1">{data.index}</p>
                          <p className="text-blue-600">Izquierdo: {data.izquierdo} kg</p>
                          <p className="text-green-600">Derecho: {data.derecho} kg</p>
                          <p className="text-gray-600 text-sm mt-1">Diferencia: {data.diferencia.toFixed(1)}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="izquierdo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Pie Izquierdo"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="derecho"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Pie Derecho"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {needsScroll && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              ← Desliza horizontalmente para ver todas las {chartData.length} pisadas →
            </p>
          )}
        </div>
      )}

      {/* Measurements List */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Mediciones Detalladas</h3>
        {session.measurements?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay mediciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración (ms)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {session.measurements?.map((measurement, index) => (
                  <tr key={measurement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {measurement.foot === 'left' ? '👟 Izquierdo' : '👟 Derecho'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{measurement.weight}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{measurement.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(measurement.timestamp), "HH:mm:ss", { locale: es })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="card">
          <h3 className="text-xl font-bold mb-2">Notas</h3>
          <p className="text-gray-700">{session.notes}</p>
        </div>
      )}
    </div>
  )
}

export default SessionDetail

