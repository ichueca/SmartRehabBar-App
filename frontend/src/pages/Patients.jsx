import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { patientsAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

const Patients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    diagnosis: '',
    notes: ''
  })

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await patientsAPI.getAll()
      setPatients(data)
    } catch (error) {
      console.error('Error loading patients:', error)
      alert('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await patientsAPI.create(formData)
      setShowModal(false)
      setFormData({ name: '', dateOfBirth: '', diagnosis: '', notes: '' })
      loadPatients()
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Error al crear paciente')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este paciente?')) return
    
    try {
      await patientsAPI.delete(id)
      loadPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Error al eliminar paciente')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando pacientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-gray-600 mt-1">Gestión de pacientes del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          ➕ Nuevo Paciente
        </button>
      </div>

      {/* Patients Grid */}
      {patients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No hay pacientes registrados</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4"
          >
            Crear primer paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map(patient => (
            <div key={patient.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">ID: {patient.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {patient.dateOfBirth && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nacimiento:</span>{' '}
                    {format(new Date(patient.dateOfBirth), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
                {patient.diagnosis && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Diagnóstico:</span> {patient.diagnosis}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sesiones:</span> {patient._count?.sessions || 0}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/patients/${patient.id}`}
                  className="flex-1 btn-primary text-center text-sm"
                >
                  Ver Detalles
                </Link>
                <button
                  onClick={() => handleDelete(patient.id)}
                  className="btn-danger text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nuevo Paciente</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
              
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 btn-primary">
                  Crear Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients

