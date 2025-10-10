import { useState, useEffect } from 'react'
import { patientsAPI, sessionsAPI, measurementsAPI } from '../services/api'

const SIMULATION_PROFILES = {
  NORMAL: {
    name: 'Balance Normal',
    icon: '🟢',
    description: 'Diferencia < 5%',
    color: 'green',
    maxDifference: 5
  },
  LEVE: {
    name: 'Descompensación Leve',
    icon: '🟡',
    description: 'Diferencia 10-15%',
    color: 'yellow',
    maxDifference: 15,
    minDifference: 10
  },
  SEVERA: {
    name: 'Descompensación Severa',
    icon: '🔴',
    description: 'Diferencia 20-30%',
    color: 'red',
    maxDifference: 30,
    minDifference: 20
  }
}

const SessionSimulator = ({ onSessionStarted }) => {
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

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

  const generateWeight = (baseWeight, variation = 3) => {
    return parseFloat((baseWeight + (Math.random() * variation * 2 - variation)).toFixed(1))
  }

  const generateMeasurementPair = (profile, stepNumber) => {
    // Peso base realista (60-75 kg)
    const baseWeight = 62 + Math.random() * 13
    
    let leftWeight, rightWeight
    
    if (profile === SIMULATION_PROFILES.NORMAL) {
      // Balance normal: diferencia < 5%
      leftWeight = generateWeight(baseWeight, 2)
      const maxDiff = baseWeight * 0.05
      rightWeight = generateWeight(leftWeight, maxDiff)
    } else if (profile === SIMULATION_PROFILES.LEVE) {
      // Descompensación leve: 10-15%
      leftWeight = generateWeight(baseWeight, 2)
      const diffPercentage = 0.10 + Math.random() * 0.05 // 10-15%
      const isLeftHeavier = Math.random() > 0.5
      if (isLeftHeavier) {
        rightWeight = leftWeight * (1 - diffPercentage)
      } else {
        rightWeight = leftWeight * (1 + diffPercentage)
      }
      rightWeight = parseFloat(rightWeight.toFixed(1))
    } else if (profile === SIMULATION_PROFILES.SEVERA) {
      // Descompensación severa: 20-30%
      leftWeight = generateWeight(baseWeight, 2)
      const diffPercentage = 0.20 + Math.random() * 0.10 // 20-30%
      const isLeftHeavier = Math.random() > 0.5
      if (isLeftHeavier) {
        rightWeight = leftWeight * (1 - diffPercentage)
      } else {
        rightWeight = leftWeight * (1 + diffPercentage)
      }
      rightWeight = parseFloat(rightWeight.toFixed(1))
    }

    // Duración realista (700-900ms)
    const duration = 700 + Math.floor(Math.random() * 200)

    return { leftWeight, rightWeight, duration }
  }

  const simulateSession = async (profile, patient) => {
    try {
      setIsSimulating(true)
      setShowProfileSelector(false)

      // 1. Crear sesión (cerrar sesión activa si existe)
      let session
      try {
        session = await sessionsAPI.start(patient.id)
      } catch (error) {
        // Si hay una sesión activa, cerrarla primero
        if (error.response?.status === 400 && error.response?.data?.activeSessionId) {
          console.log('Cerrando sesión activa anterior...')
          try {
            await sessionsAPI.end(error.response.data.activeSessionId, 'Sesión cerrada automáticamente')
          } catch (endError) {
            // Si la sesión ya estaba finalizada, ignorar el error
            if (endError.response?.status !== 400 || !endError.response?.data?.message?.includes('finalizada')) {
              throw endError
            }
            console.log('La sesión ya estaba finalizada')
          }
          // Intentar crear la sesión nuevamente
          session = await sessionsAPI.start(patient.id)
        } else {
          throw error
        }
      }
      
      if (onSessionStarted) {
        onSessionStarted(session)
      }

      // 3. Generar mediciones (20-30 pisadas)
      const totalSteps = 20 + Math.floor(Math.random() * 11)
      setProgress({ current: 0, total: totalSteps })

      for (let i = 0; i < totalSteps; i++) {
        const { leftWeight, rightWeight, duration } = generateMeasurementPair(profile, i + 1)
        
        // Enviar medición izquierda
        const leftTimestamp = new Date().toISOString()
        await measurementsAPI.create('left', {
          sessionId: session.id,
          weight: leftWeight,
          duration,
          timestamp: leftTimestamp
        })

        // Pequeña pausa entre pies (50-150ms)
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

        // Enviar medición derecha
        const rightTimestamp = new Date().toISOString()
        await measurementsAPI.create('right', {
          sessionId: session.id,
          weight: rightWeight,
          duration,
          timestamp: rightTimestamp
        })

        setProgress({ current: i + 1, total: totalSteps })

        // Pausa entre pisadas (1-2 segundos)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
      }

      // Simulación completada - la sesión queda abierta para que el usuario la cierre cuando quiera
      setProgress({ current: 0, total: 0 })
      setIsSimulating(false)
      
    } catch (error) {
      console.error('Error en simulación:', error)
      if (error.message != 'La sesión ya está finalizada'){
        alert('Error al simular sesión')  
      }
      setIsSimulating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setShowPatientSelector(false)
    setShowProfileSelector(true)
  }

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile)
    simulateSession(profile, selectedPatient)
  }

  const handleOpenSelector = () => {
    setShowPatientSelector(true)
    setShowProfileSelector(false)
  }

  const handleCancel = () => {
    setShowPatientSelector(false)
    setShowProfileSelector(false)
    setSelectedPatient(null)
    setSelectedProfile(null)
  }

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={handleOpenSelector}
        disabled={isSimulating}
        className={`btn-primary ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSimulating ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Simulando... ({progress.current}/{progress.total})</span>
          </span>
        ) : (
          '🎮 Iniciar Sesión de Prueba'
        )}
      </button>

      {/* Selector de paciente */}
      {showPatientSelector && !isSimulating && (
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

      {/* Selector de perfil */}
      {showProfileSelector && !isSimulating && selectedPatient && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[350px]">
          <div className="mb-3 pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">Paciente seleccionado:</p>
            <p className="font-bold text-gray-900">{selectedPatient.name}</p>
          </div>
          <h4 className="font-bold text-gray-900 mb-3">Selecciona el perfil de simulación:</h4>
          <div className="space-y-2">
            {Object.values(SIMULATION_PROFILES).map((profile) => (
              <button
                key={profile.name}
                onClick={() => handleProfileSelect(profile)}
                className={`w-full text-left p-3 rounded-lg border-2 hover:border-${profile.color}-500 hover:bg-${profile.color}-50 transition-all`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{profile.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-600">{profile.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => {
                setShowProfileSelector(false)
                setShowPatientSelector(true)
              }}
              className="flex-1 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Cambiar paciente
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionSimulator

