/**
 * Componente para iniciar sesiones de Sit-to-Stand (levantarse)
 * Permite al terapeuta iniciar y gestionar mediciones de levantarse
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { patientsAPI } from '../services/api'

const SitToStandStarter = ({ onSitToStandStarted }) => {
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const navigate = useNavigate()
  const { socket } = useSocket()

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Medición Levantarse
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Mide la fuerza y equilibrio del paciente al levantarse desde sentado hasta de pie
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-left bg-blue-50 p-3 rounded text-sm">
            <h4 className="font-medium text-blue-900 mb-2">📋 Instrucciones:</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Paciente sentado entre las plataformas</li>
              <li>Pulsar "Iniciar Medición"</li>
              <li>Indicar al paciente que se levante</li>
              <li>Pulsar "Finalizar" cuando esté completamente de pie</li>
            </ol>
          </div>

          <div className="relative">
            <button
              onClick={handleOpenSelector}
              disabled={isStarting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isStarting
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isStarting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando...
                </div>
              ) : (
                '🪑 Iniciar Medición Levantarse'
              )}
            </button>

            {/* Selector de pacientes */}
            {showPatientSelector && (
              <div className="patient-selector absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[350px] max-h-[400px] overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-3">Selecciona el paciente:</h4>
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

        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Asegúrate de que hay una sesión activa antes de iniciar</p>
        </div>
      </div>
    </div>
  )
}

export default SitToStandStarter
