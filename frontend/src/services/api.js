const API_BASE_URL = '/api'

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`)
    // Preservar información de la respuesta para manejo de errores
    error.response = {
      status: response.status,
      data: errorData
    }
    throw error
  }
  return response.json()
}

// Pacientes
export const patientsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`)
    return handleResponse(response)
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`)
    return handleResponse(response)
  },
  
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },
  
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  }
}

// Sesiones
export const sessionsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions`)
    return handleResponse(response)
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`)
    return handleResponse(response)
  },
  
  start: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    })
    return handleResponse(response)
  },
  
  end: async (id, notes = '') => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    })
    return handleResponse(response)
  }
}

// Mediciones
export const measurementsAPI = {
  create: async (foot, data) => {
    const response = await fetch(`${API_BASE_URL}/measurements/${foot}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },
  
  getBySession: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/measurements/session/${sessionId}`)
    return handleResponse(response)
  }
}

