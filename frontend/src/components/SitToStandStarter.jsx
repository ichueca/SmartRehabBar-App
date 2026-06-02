/**
 * Componente para iniciar sesiones de Sit-to-Stand (levantarse)
 * Permite al terapeuta iniciar y gestionar mediciones de levantarse
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { patientsAPI } from '../services/api'
import BatteryIndicator from './BatteryIndicator'

const SitToStandStarter = ({ onSitToStandStarted }) => {
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const navigate = useNavigate()
  const { socket, batteryLevels } = useSocket()

  // Verificar si hay batería baja
  const hasLowBattery = (batteryLevels.left !== null && batteryLevels.left < 20) ||
                        (batteryLevels.right !== null && batteryLevels.right < 20)

  // Cerrar selector al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientSelector && !event.target.closest('.patient-selector')) {
        setShowPatientSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPatientSelector])

  // Cargar pacientes cuando se abre el selector
  const loadPatients = async () => {
    setLoadingPatients(true)
    try {
      const patientsData = await patientsAPI.getAll()
      setPatients(patientsData)
    } catch (error) {
      console.error('Error loading patients:', error)
      setError('Error cargando pacientes')
    } finally {
      setLoadingPatients(false)
    }
  }

  const handleOpenSelector = () => {
    setShowPatientSelector(true)
    loadPatients()
  }

  const handlePatientSelect = async (patient) => {
    setShowPatientSelector(false)
    await startSitToStandWithPatient(patient)
  }

  const startSitToStandWithPatient = async (patient) => {
    setIsStarting(true)
    setError('')

    try {
      const response = await fetch('/api/sit-to-stand/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Éxito - navegar a la vista de sit-to-stand
        if (onSitToStandStarted) {
          onSitToStandStarted(data.sitToStandSession)
        }
        navigate(`/sit-to-stand/${data.sitToStandSession.id}`)
      } else {
        // Error del servidor
        if (data.error === 'missing_patient') {
          setError('Error: No se especificó el paciente.')
        } else if (data.error === 'sit_to_stand_already_active') {
          setError('Ya hay una medición de levantarse activa.')
          // Navegar a la sesión activa
          navigate(`/sit-to-stand/${data.activeSitToStand.id}`)
        } else if (data.error === 'session_already_active') {
          setError('Ya hay una sesión activa en el sistema. Finalízala primero.')
        } else {
          setError(data.message || 'Error desconocido')
        }
      }
    } catch (error) {
      console.error('Error starting sit-to-stand:', error)
      setError('Error de conexión con el servidor')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={handleOpenSelector}
        disabled={isStarting}
        className={`btn-primary ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isStarting ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Iniciando...</span>
          </span>
        ) : (
          'Iniciar Medición Levantarse'
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="relative">

            {/* Selector de pacientes */}
            {showPatientSelector && (
              <div className="patient-selector absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[400px] max-h-[600px] overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-3">Medición Levantarse</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Mide la fuerza y equilibrio del paciente al levantarse desde sentado hasta de pie
                </p>

                {/* Instrucciones */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-xs font-semibold text-blue-900 mb-2">📋 Instrucciones:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800">
                    <li>Paciente sentado entre las plataformas</li>
                    <li>Pulsar "Iniciar Medición"</li>
                    <li>Indicar al paciente que se levante</li>
                    <li>Pulsar "Finalizar" cuando esté completamente de pie</li>
                  </ol>
                </div>

                {/* Indicadores de batería */}
                {(batteryLevels.left !== null || batteryLevels.right !== null) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Estado de Sensores:</p>
                    <div className="flex space-x-2">
                      <BatteryIndicator level={batteryLevels.left} foot="left" />
                      <BatteryIndicator level={batteryLevels.right} foot="right" />
                    </div>
                    {hasLowBattery && (
                      <div className="mt-2 flex items-center space-x-2 text-orange-600">
                        <span className="text-sm">⚠️</span>
                        <p className="text-xs font-medium">Batería baja detectada</p>
                      </div>
                    )}
                  </div>
                )}

                <h5 className="font-semibold text-gray-900 mb-2 text-sm">Selecciona el paciente:</h5>

                {loadingPatients ? (
                  <div className="text-center py-4 text-gray-600">Cargando pacientes...</div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">No hay pacientes registrados</p>
                    <p className="text-sm text-gray-500">Crea un paciente en la sección de Pacientes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full text-left p-3 rounded-lg border-2 hover:border-green-500 hover:bg-green-50 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">👤</span>
                          <div>
                            <p className="font-semibold text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-600">
                              {patient.age} años • {patient.condition || 'Sin condición especificada'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowPatientSelector(false)}
                  className="mt-3 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
      </div>
    </div>
  )
}

export default SitToStandStarter
