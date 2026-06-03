/**
 * Vista para mostrar sesión de Sit-to-Stand en tiempo real
 * Muestra gráficos, métricas y controles para la medición de levantarse
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

const SitToStandView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [sitToStandSession, setSitToStandSession] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFinishing, setIsFinishing] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadSitToStandSession()
  }, [id])

  // Escuchar eventos de Socket.IO
  useEffect(() => {
    if (!socket) return

    const handleMeasurement = (data) => {
      if (data.measurement && data.sitToStandSession?.id === parseInt(id)) {
        setMeasurements(prev => [...prev, data.measurement])
      }
    }

    const handleSitToStandEnded = (data) => {
      if (data.id === parseInt(id)) {
        setSitToStandSession(data)
        // Mostrar resultados finales
        setTimeout(() => {
          navigate(`/sit-to-stand-results/${id}`)
        }, 2000)
      }
    }

    socket.on('sit-to-stand:measurement', handleMeasurement)
    socket.on('sit-to-stand:ended', handleSitToStandEnded)

    return () => {
      socket.off('sit-to-stand:measurement', handleMeasurement)
      socket.off('sit-to-stand:ended', handleSitToStandEnded)
    }
  }, [socket, id, navigate])

  const loadSitToStandSession = async () => {
    try {
      const response = await fetch(`/api/sit-to-stand/${id}`)

      if (response.ok) {
        const data = await response.json()
        setSitToStandSession(data)
        setMeasurements(data.measurements || [])
      } else {
        setError('Sesión de levantarse no encontrada')
      }
    } catch (error) {
      console.error('Error loading sit-to-stand session:', error)
      setError('Error cargando la sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const finishSitToStand = async () => {
    if (!window.confirm('¿Finalizar la medición de levantarse?')) {
      return
    }

    setIsFinishing(true)
    try {
      const response = await fetch(`/api/sit-to-stand/${id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSitToStandSession(data)
        // Navegar a resultados después de un breve delay
        setTimeout(() => {
          navigate(`/sit-to-stand-results/${id}`)
        }, 1500)
      } else {
        alert('Error al finalizar la medición')
      }
    } catch (error) {
      console.error('Error finishing sit-to-stand:', error)
      alert('Error al finalizar la medición')
    } finally {
      setIsFinishing(false)
    }
  }

  const formatTime = (seconds) => {
    return `${seconds.toFixed(1)}s`
  }

  const getLatestWeights = () => {
    if (measurements.length === 0) return { left: 0, right: 0 }
    const latest = measurements[measurements.length - 1]
    return {
      left: latest.weightLeft || 0,
      right: latest.weightRight || 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl mb-4">❌ {error}</div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  const isActive = sitToStandSession?.status === 'active'
  const latestWeights = getLatestWeights()
  const currentTime = measurements.length > 0
    ? measurements[measurements.length - 1].elapsedSeconds
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isActive ? '🟢 Midiendo: Levantarse' : '⏹️ Medición Finalizada'}
            </h1>
            <p className="text-gray-600">
              Paciente: {sitToStandSession?.session?.patient?.name}
            </p>
            <p className="text-sm text-gray-500">
              Duración: {formatTime(currentTime)}
            </p>
          </div>

          {isActive && (
            <button
              onClick={finishSitToStand}
              disabled={isFinishing}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              {isFinishing ? 'Finalizando...' : '⏹️ FINALIZAR MEDICIÓN'}
            </button>
          )}
        </div>
      </div>

      {/* Mediciones en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Peso Actual</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pie Izquierdo:</span>
              <span className="text-2xl font-bold text-blue-600">
                {latestWeights.left.toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pie Derecho:</span>
              <span className="text-2xl font-bold text-green-600">
                {latestWeights.right.toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                {(latestWeights.left + latestWeights.right).toFixed(1)} kg
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Estadísticas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mediciones:</span>
              <span className="text-xl font-bold">{measurements.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tiempo transcurrido:</span>
              <span className="text-xl font-bold">{formatTime(currentTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estado:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Activa' : 'Finalizada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      {isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📋 Instrucciones:</h4>
          <p className="text-blue-800">
            El paciente debe levantarse lentamente desde la posición sentada hasta estar completamente de pie.
            Pulsa "FINALIZAR MEDICIÓN" cuando el paciente esté estable y de pie.
          </p>
        </div>
      )}
    </div>
  )
}

export default SitToStandView
