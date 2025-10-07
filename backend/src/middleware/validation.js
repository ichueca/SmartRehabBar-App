// Middleware para validar datos de entrada

export const validatePatient = (req, res, next) => {
  const { name } = req.body
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El nombre del paciente es requerido'
    })
  }
  
  if (name.length > 100) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El nombre no puede exceder 100 caracteres'
    })
  }
  
  next()
}

export const validateSession = (req, res, next) => {
  const { patientId } = req.body
  
  if (!patientId || typeof patientId !== 'number') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El ID del paciente es requerido y debe ser un número'
    })
  }
  
  next()
}

export const validateMeasurement = (req, res, next) => {
  const { sessionId, weight, timestamp } = req.body
  
  if (!sessionId || typeof sessionId !== 'number') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El ID de sesión es requerido'
    })
  }
  
  if (!weight || typeof weight !== 'number' || weight < 1 || weight > 300) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El peso debe estar entre 1 y 300 kg'
    })
  }
  
  if (!timestamp) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'El timestamp es requerido'
    })
  }
  
  next()
}
