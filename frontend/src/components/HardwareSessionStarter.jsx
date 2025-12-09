import { useState, useEffect } from 'react'
import { patientsAPI, sessionsAPI } from '../services/api'

// Patrón por defecto para el simulador (no visible al usuario)
const DEFAULT_PATTERN = {
  command: 'normal'
}

const HardwareSessionStarter = ({ onSessionStarted }) => {
  const [isStarting, setIsStarting] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [activeSessionToClose, setActiveSessionToClose] = useState(null)
  const [activePatientName, setActivePatientName] = useState('')
  const [pendingSession, setPendingSession] = useState(null)

  // Cargar pacientes cuando se abre el selector
  useEffect(() => {
    if (showPatientSelector && patients.length === 0) {
      loadPatients()
    }
  }, [showPatientSelector])

  const loadPatients = async () => {
    try {
      setLoadingPatients(true)
      const data = await patientsAPI.getAll()
      setPatients(data)
    } catch (error) {
      console.error('Error loading patients:', error)
      alert('Error al cargar pacientes')
    } finally {
      setLoadingPatients(false)
    }
  }

  const startHardwareSession = async (pattern, patient) => {
    try {
      setIsStarting(true)
      setShowPatientSelector(false)

      // 1. Crear sesión (mostrar confirmación si hay sesión activa)
      let session
      try {
        session = await sessionsAPI.start(patient.id)
      } catch (error) {
        // Si hay una sesión activa, mostrar confirmación
        if (error.response?.status === 400 && error.response?.data?.activeSessionId) {
          const activeSessionId = error.response.data.activeSessionId
          const activePatientName = error.response.data.activePatientName || 'Paciente desconocido'

          // Guardar datos para la confirmación
          setActiveSessionToClose(activeSessionId)
          setActivePatientName(activePatientName)
          setPendingSession({ pattern, patient })
          setShowConfirmModal(true)
          setIsStarting(false)
          return // Salir y esperar confirmación del usuario
        } else {
          throw error
        }
      }
      
      if (onSessionStarted) {
        onSessionStarted(session)
      }

      // 2. Iniciar simulador de hardware
      await startHardwareSimulator(pattern.command)

      setIsStarting(false)
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      alert('Error al iniciar sesión con hardware')
      setIsStarting(false)
    }
  }

  const startHardwareSimulator = async (pattern) => {
    try {
      // Llamar al endpoint del backend para iniciar el simulador
      const response = await fetch(`/api/hardware/simulator/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern: pattern,
          duration: 30, // 30 segundos por defecto
          frequency: 10 // 10 Hz por defecto
        })
      })

      if (!response.ok) {
        throw new Error('Error al iniciar simulador de hardware')
      }

      console.log(`🚀 Simulador de hardware iniciado con patrón: ${pattern}`)
    } catch (error) {
      console.error('Error starting hardware simulator:', error)
      // No es crítico, la sesión ya se creó
    }
  }

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setShowPatientSelector(false)
    // Iniciar sesión directamente con patrón normal por defecto
    startHardwareSession(DEFAULT_PATTERN, patient)
  }

  const handleConfirmSession = async () => {
    try {
      setShowConfirmModal(false)
      setIsStarting(true)

      // Finalizar la sesión activa
      await sessionsAPI.end(activeSessionToClose, 'Sesión cerrada para iniciar nueva sesión')

      // Continuar con la nueva sesión
      const { pattern, patient } = pendingSession
      await continueSession(pattern, patient)

    } catch (error) {
      console.error('Error al confirmar sesión:', error)
      alert('Error al finalizar sesión activa')
      setIsStarting(false)
    } finally {
      // Limpiar estados
      setActiveSessionToClose(null)
      setActivePatientName('')
      setPendingSession(null)
    }
  }

  const handleCancelSession = () => {
    setShowConfirmModal(false)
    setActiveSessionToClose(null)
    setActivePatientName('')
    setPendingSession(null)
  }

  const continueSession = async (pattern, patient) => {
    try {
      // Crear la nueva sesión
      const session = await sessionsAPI.start(patient.id)

      if (onSessionStarted) {
        onSessionStarted(session)
      }

      // Iniciar simulador de hardware
      await startHardwareSimulator(pattern.command)

      setIsStarting(false)

    } catch (error) {
      console.error('Error en nueva sesión:', error)
      alert('Error al crear nueva sesión')
      setIsStarting(false)
    }
  }

  const handleOpenSelector = () => {
    setShowPatientSelector(true)
  }

  const handleCancel = () => {
    setShowPatientSelector(false)
    setSelectedPatient(null)
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
          '🚶 Iniciar Medición Pisadas'
        )}
      </button>

      {/* Selector de paciente */}
      {showPatientSelector && !isStarting && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[350px] max-h-[400px] overflow-y-auto">
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
                  className="w-full text-left p-3 rounded-lg border-2 hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="font-semibold text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">
                        {patient._count?.sessions || 0} sesiones
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCancel}
            className="mt-3 w-full text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
        </div>
      )}



      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Sesión Activa Detectada
                </h3>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Hay una sesión activa en el sistema para <strong>{activePatientName}</strong>.
                Para iniciar la nueva medición de pisadas, la sesión actual será finalizada automáticamente.
              </p>
              <p className="text-sm text-gray-800 mt-2 font-medium">
                ¿Deseas continuar y finalizar la sesión activa?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelSession}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSession}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sí, Finalizar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HardwareSessionStarter
