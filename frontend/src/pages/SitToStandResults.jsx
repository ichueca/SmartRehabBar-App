/**
 * Vista para mostrar resultados de sesión de Sit-to-Stand completada
 * Muestra métricas finales, gráficos y análisis de la medición
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const SitToStandResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [sitToStandSession, setSitToStandSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSitToStandSession()
  }, [id])

  const loadSitToStandSession = async () => {
    try {
      const response = await fetch(`/api/sit-to-stand/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setSitToStandSession(data)
      } else {
        setError('Sesión de levantarse no encontrada')
      }
    } catch (error) {
      console.error('Error loading sit-to-stand session:', error)
      setError('Error cargando los resultados')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    return `${seconds?.toFixed(1) || 0}s`
  }

  const getSymmetryColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSymmetryLabel = (percentage) => {
    if (percentage >= 90) return 'Excelente'
    if (percentage >= 75) return 'Buena'
    if (percentage >= 60) return 'Regular'
    return 'Necesita mejora'
  }

  const getAiSeverityColor = (severity) => {
    if (severity === 'estable') return 'text-green-700'
    if (severity === 'leve') return 'text-yellow-700'
    if (severity === 'moderada') return 'text-orange-700'
    return 'text-red-700'
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
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  const measurements = sitToStandSession?.measurements || []
  const maxWeightLeft = sitToStandSession?.maxWeightLeft || 0
  const maxWeightRight = sitToStandSession?.maxWeightRight || 0
  const symmetryPercentage = sitToStandSession?.symmetryPercentage || 0
  const duration = sitToStandSession?.durationSeconds || 0
  const aiInterpretation = sitToStandSession?.aiInterpretation

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ✅ Resultados: Levantarse
              </h1>
              <p className="text-gray-600">
                Paciente: {sitToStandSession?.session?.patient?.name}
              </p>
              <p className="text-sm text-gray-500">
                Completado: {new Date(sitToStandSession?.endTime).toLocaleString()}
              </p>
            </div>
            
            <div className="text-right">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary mr-2"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate(`/sessions/${sitToStandSession?.sessionId}`)}
                className="btn-secondary"
              >
                Ver Sesión Completa
              </button>
            </div>
          </div>
        </div>

        {aiInterpretation?.available && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Interpretación IA experimental</h3>
                <p className="text-2xl font-bold text-indigo-950">{aiInterpretation.labelText}</p>
                <p className={`mt-2 font-medium ${getAiSeverityColor(aiInterpretation.severity)}`}>
                  Severidad: {aiInterpretation.severity}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:min-w-[320px]">
                <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
                  <div className="text-sm text-gray-500">Confianza</div>
                  <div className="text-2xl font-bold text-indigo-700">{aiInterpretation.confidence}%</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
                  <div className="text-sm text-gray-500">Modelo</div>
                  <div className="text-sm font-semibold text-indigo-700">{aiInterpretation.modelId}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <h4 className="font-semibold text-gray-900 mb-2">Resumen</h4>
                <p className="text-gray-700">{aiInterpretation.explanation}</p>
                <p className="text-gray-700 mt-3">{aiInterpretation.recommendation}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <h4 className="font-semibold text-gray-900 mb-2">Variables del modelo</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between"><span>Simetría</span><span>{aiInterpretation.features.symmetryPercentage}%</span></div>
                  <div className="flex justify-between"><span>Dominancia izquierda</span><span>{aiInterpretation.features.leftDominance}%</span></div>
                  <div className="flex justify-between"><span>Duración</span><span>{aiInterpretation.features.durationSeconds}s</span></div>
                  <div className="flex justify-between"><span>Variabilidad reparto</span><span>{aiInterpretation.features.distributionStd}</span></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-indigo-700 mt-4">
              Resultado experimental para justificar el objetivo de investigación en IA. No sustituye la valoración clínica.
            </p>
          </div>
        )}

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatTime(duration)}
            </div>
            <div className="text-gray-600">Duración Total</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {maxWeightLeft.toFixed(1)} kg
            </div>
            <div className="text-gray-600">Máximo Izquierdo</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {maxWeightRight.toFixed(1)} kg
            </div>
            <div className="text-gray-600">Máximo Derecho</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${getSymmetryColor(symmetryPercentage)}`}>
              {symmetryPercentage.toFixed(1)}%
            </div>
            <div className="text-gray-600">Simetría</div>
            <div className={`text-sm font-medium ${getSymmetryColor(symmetryPercentage)}`}>
              {getSymmetryLabel(symmetryPercentage)}
            </div>
          </div>
        </div>

        {/* Análisis detallado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Análisis de Fuerza</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Pie Izquierdo</span>
                  <span className="font-medium">{maxWeightLeft.toFixed(1)} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ width: `${(maxWeightLeft / (maxWeightLeft + maxWeightRight)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span>Pie Derecho</span>
                  <span className="font-medium">{maxWeightRight.toFixed(1)} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ width: `${(maxWeightRight / (maxWeightLeft + maxWeightRight)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Fuerza Total:</span>
                  <span className="font-bold text-lg">
                    {(maxWeightLeft + maxWeightRight).toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">⚖️ Evaluación de Simetría</h3>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${getSymmetryColor(symmetryPercentage)}`}>
                {symmetryPercentage.toFixed(1)}%
              </div>
              <div className={`text-xl font-medium mb-4 ${getSymmetryColor(symmetryPercentage)}`}>
                {getSymmetryLabel(symmetryPercentage)}
              </div>
              
              <div className="text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Diferencia absoluta:</span>
                  <span>{Math.abs(maxWeightLeft - maxWeightRight).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Mediciones totales:</span>
                  <span>{measurements.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Recomendaciones</h3>
          <div className="space-y-2 text-blue-800">
            {symmetryPercentage >= 90 && (
              <p>✅ Excelente simetría. El paciente muestra un buen equilibrio entre ambas piernas.</p>
            )}
            {symmetryPercentage >= 75 && symmetryPercentage < 90 && (
              <p>⚠️ Buena simetría con ligero desequilibrio. Considerar ejercicios de fortalecimiento.</p>
            )}
            {symmetryPercentage < 75 && (
              <p>🔴 Asimetría significativa. Se recomienda evaluación detallada y ejercicios específicos.</p>
            )}

            {duration > 10 && (
              <p>⏱️ Tiempo elevado para levantarse. Considerar ejercicios de fortalecimiento de piernas.</p>
            )}
            {duration < 3 && (
              <p>⚡ Movimiento muy rápido. Verificar que se realizó correctamente.</p>
            )}
          </div>
        </div>
      </div>
  )
}

export default SitToStandResults
