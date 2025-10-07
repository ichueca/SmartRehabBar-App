import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import patientsRouter from './routes/patients.js'
import sessionsRouter from './routes/sessions.js'
import measurementsRouter from './routes/measurements.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware global
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}))
app.use(express.json())

// Logging middleware (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
  })
}

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartRehabBar API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      patients: '/api/patients',
      sessions: '/api/sessions',
      measurements: '/api/measurements'
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas de la API
app.use('/api/patients', patientsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/measurements', measurementsRouter)

// Middleware de manejo de errores (debe ir al final)
app.use(notFound)
app.use(errorHandler)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`)
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(` API disponible en http://localhost:${PORT}/api`)
})
