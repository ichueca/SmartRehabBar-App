// Middleware para manejo centralizado de errores

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)
  
  // Error de Prisma (base de datos)
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      error: 'Database error',
      message: 'Error en la operación de base de datos',
      code: err.code
    })
  }
  
  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    })
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  })
}

// Middleware para rutas no encontradas
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Ruta ${req.method} ${req.url} no encontrada`
  })
}
