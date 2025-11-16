import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { patientsAPI, sessionsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

const PatientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [activeSessionToClose, setActiveSessionToClose] = useState(null)

  useEffect(() => {
    loadPatientData()
  }, [id])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const patientData = await patientsAPI.getById(id)
      setPatient(patientData)
      setSessions(patientData.sessions || [])
    } catch (error) {
      console.error('Error loading patient:', error)
      alert('Error al cargar paciente')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      const session = await sessionsAPI.start(parseInt(id))
      navigate(`/active-session/${session.id}`)
    } catch (error) {
      console.error('Error starting session:', error)

      // Si el error es porque ya hay una sesión activa, mostrar confirmación
      if (error.response?.status === 400 && error.response?.data?.activeSessionId) {
        const activeSessionId = error.response.data.activeSessionId
        setActiveSessionToClose(activeSessionId)
        setShowConfirmModal(true)
      } else {
        alert(error.message || 'Error al iniciar sesión')
      }
    }
  }

  const handleConfirmNewSession = async () => {
    try {
      // Primero finalizar la sesión activa
      await sessionsAPI.end(activeSessionToClose, 'Sesión cerrada para iniciar nueva sesión')

      // Luego crear la nueva sesión
      const session = await sessionsAPI.start(parseInt(id))
      navigate(`/active-session/${session.id}`)

      // Cerrar modal
      setShowConfirmModal(false)
      setActiveSessionToClose(null)
    } catch (error) {
      console.error('Error creating new session:', error)
      alert('Error al crear nueva sesión')
    }
  }

  const handleCancelNewSession = () => {
    setShowConfirmModal(false)
    setActiveSessionToClose(null)
  }

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente no encontrado</div>
  }

  const activeSessions = sessions.filter(s => !s.endTime)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/patients" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Volver a Pacientes
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">{patient.name}</h2>
          <p className="text-gray-600 mt-1">ID: {patient.id}</p>
        </div>
        {activeSessions.length > 0 ? (
          <div className="text-right">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    🟢 Sesión Activa
                  </p>
                  <p className="text-xs text-green-600">
                    Iniciada: {format(new Date(activeSessions[0].startTime), "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <Link
                  to={`/active-session/${activeSessions[0].id}`}
                  className="btn-primary text-sm"
                >
                  Ver Sesión
                </Link>
              </div>
            </div>
            <button
              onClick={handleStartSession}
              className="btn-secondary text-sm"
            >
              🔄 Nueva Sesión
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartSession}
            className="btn-primary"
          >
            🟢 Iniciar Sesión
          </button>
        )}
      </div>

      {/* Patient Info */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Información del Paciente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient.dateOfBirth && (
            <div>
              <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
              <p className="font-medium">
                {format(new Date(patient.dateOfBirth), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          )}
          {patient.diagnosis && (
            <div>
              <p className="text-sm text-gray-600">Diagnóstico</p>
              <p className="font-medium">{patient.diagnosis}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Total de Sesiones</p>
            <p className="font-medium">{sessions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sesiones Activas</p>
            <p className="font-medium">{activeSessions.length}</p>
          </div>
        </div>
        {patient.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Notas</p>
            <p className="text-gray-800">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Sessions History */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Historial de Sesiones</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay sesiones registradas</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Sesión #{session.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(session.startTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                    {session.endTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Duración: {Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)} min
                      </p>
                    )}
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
                Ya hay una sesión activa en el sistema. Para iniciar una nueva sesión,
                la sesión actual será finalizada automáticamente.
              </p>
              <p className="text-sm text-gray-800 mt-2 font-medium">
                ¿Deseas continuar y finalizar la sesión activa?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelNewSession}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmNewSession}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sí, Finalizar y Crear Nueva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDetail

