import express from 'express'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cors from 'cors'
import dotenv from 'dotenv'
import patientsRouter from './routes/patients.js'
import sessionsRouter from './routes/sessions.js'
import measurementsRouter from './routes/measurements.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import socketService from './services/socketService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000

// Inicializar Socket.IO
socketService.initialize(httpServer)

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

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  const publicPath = join(__dirname, '..', 'public')
  app.use(express.static(publicPath))

  app.get('*', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'))
  })
} else {
  // Middleware de manejo de errores (solo en desarrollo)
  app.use(notFound)
  app.use(errorHandler)
}

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`)
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(` API disponible en http://localhost:${PORT}/api`)
  console.log(` Socket.IO listo para conexiones`)
})
