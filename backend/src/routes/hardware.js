import express from 'express'
import sessionService from '../services/sessionService.js'
import measurementService from '../services/measurementService.js'
import socketService from '../services/socketService.js'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Cache para filtros temporales - evitar saturación
const recentMeasurements = new Map() // foot -> {timestamp, weight, sessionId}

// Control del simulador
let simulatorProcess = null

/**
 * Endpoint para recibir mediciones de sensores de hardware
 * GET /api/hardware/:foot?peso=70.5
 * 
 * Parámetros:
 * - foot: 'left' | 'right' - Identificador del pie
 * - peso: number - Peso medido en kg
 * 
 * Respuestas:
 * - 200: Medición procesada correctamente
 * - 400: Parámetros inválidos
 * - 404: No hay sesión activa
 * - 429: Filtrado por frecuencia/cambio mínimo
 */
router.get('/:foot', async (req, res) => {
  try {
    const { foot } = req.params
    const { peso } = req.query
    
    // Validar parámetros
    if (!foot || !['left', 'right'].includes(foot)) {
      return res.status(400).json({
        error: 'Invalid foot parameter',
        message: 'foot must be "left" or "right"'
      })
    }
    
    if (!peso || isNaN(parseFloat(peso))) {
      return res.status(400).json({
        error: 'Invalid peso parameter',
        message: 'peso must be a valid number'
      })
    }
    
    const weight = parseFloat(peso)
    const now = Date.now()
    
    // Verificar si hay sesión activa
    const activeSession = await sessionService.getAnyActiveSession()
    if (!activeSession) {
      return res.json({
        status: 'no_active_session',
        message: 'No hay sesión activa para registrar mediciones'
      })
    }
    
    // Aplicar filtros para evitar saturación
    const recentKey = `${foot}_${activeSession.id}`
    const recent = recentMeasurements.get(recentKey)
    
    // Filtro temporal: mínimo 50ms entre mediciones del mismo pie
    if (recent && (now - recent.timestamp) < 50) {
      return res.json({
        status: 'filtered_time',
        message: 'Medición filtrada por frecuencia (< 50ms)',
        sessionId: activeSession.id
      })
    }
    
    // Filtro de cambio mínimo: 1kg diferencia
    if (recent && Math.abs(weight - recent.weight) < 1.0) {
      // Actualizar timestamp pero no crear nueva medición
      recentMeasurements.set(recentKey, {
        timestamp: now,
        weight: recent.weight, // Mantener peso anterior
        sessionId: activeSession.id
      })
      
      return res.json({
        status: 'filtered_weight',
        message: 'Medición filtrada por cambio mínimo (< 1kg)',
        sessionId: activeSession.id
      })
    }
    
    // Crear medición en base de datos
    const measurement = await measurementService.createFromHardware(
      activeSession.id,
      foot,
      weight
    )
    
    // Actualizar cache de mediciones recientes
    recentMeasurements.set(recentKey, {
      timestamp: now,
      weight: weight,
      sessionId: activeSession.id
    })
    
    // Emitir medición individual
    socketService.emitMeasurement({
      paired: false,
      foot: foot,
      weight: measurement.weight,
      sessionId: activeSession.id,
      measurement: measurement
    })

    // Intentar emparejar con medición reciente del pie opuesto
    const oppositeFoot = foot === 'left' ? 'right' : 'left'
    const pairTimeWindow = 2000 // 2 segundos para encontrar par

    try {
      const recentMeasurements = await measurementService.getRecentUnpaired(
        activeSession.id,
        oppositeFoot,
        pairTimeWindow
      )

      if (recentMeasurements.length > 0) {
        // Encontrar la medición más reciente del pie opuesto
        const pairMeasurement = recentMeasurements[0]

        // Crear emparejamiento
        const pairedData = await measurementService.createPair(measurement, pairMeasurement)

        console.log(`🔗 Pisada emparejada: ${foot}=${measurement.weight}kg + ${oppositeFoot}=${pairMeasurement.weight}kg`)

        // Emitir pisada completa
        socketService.emitMeasurement(pairedData)
      }
    } catch (pairError) {
      console.log('⚠️ Error al intentar emparejar:', pairError.message)
      // No es crítico, la medición individual ya se guardó
    }
    
    res.json({
      status: 'ok',
      message: 'Medición registrada correctamente',
      sessionId: activeSession.id,
      measurementId: measurement.id,
      patientName: activeSession.patient.name
    })
    
  } catch (error) {
    console.error('Error processing hardware measurement:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error al procesar medición del hardware'
    })
  }
})

// Endpoint para limpiar cache (útil para pruebas)
router.delete('/cache', (req, res) => {
  recentMeasurements.clear()
  res.json({
    status: 'ok',
    message: 'Cache de mediciones limpiado'
  })
})

// Endpoint para ver estado del cache (útil para debugging)
router.get('/cache/status', (req, res) => {
  const cacheEntries = Array.from(recentMeasurements.entries()).map(([key, value]) => ({
    key,
    ...value,
    ageMs: Date.now() - value.timestamp
  }))

  res.json({
    status: 'ok',
    cacheSize: recentMeasurements.size,
    entries: cacheEntries
  })
})

// Endpoint para iniciar simulador de hardware
router.post('/simulator/start', async (req, res) => {
  try {
    const { pattern = 'normal', duration = 30, frequency = 10 } = req.body

    // Detener simulador anterior si existe
    if (simulatorProcess) {
      simulatorProcess.kill()
      simulatorProcess = null
    }

    // Verificar que hay una sesión activa
    const activeSessions = await sessionService.getActiveSessions()
    if (activeSessions.length === 0) {
      return res.status(400).json({
        error: 'no_active_session',
        message: 'No hay sesión activa para iniciar el simulador'
      })
    }

    // Construir comando del simulador
    const scriptPath = path.join(__dirname, '../scripts/simulate-hardware.js')
    const args = [
      scriptPath,
      '--duration', duration.toString(),
      '--frequency', frequency.toString(),
      '--pattern', pattern,
      '--auto-stop' // Para que se detenga automáticamente
    ]

    // Iniciar simulador
    simulatorProcess = spawn('node', args, {
      cwd: path.join(__dirname, '../../'),
      stdio: ['pipe', 'pipe', 'pipe']
    })

    simulatorProcess.stdout.on('data', (data) => {
      console.log(`Simulador: ${data.toString().trim()}`)
    })

    simulatorProcess.stderr.on('data', (data) => {
      console.error(`Simulador Error: ${data.toString().trim()}`)
    })

    simulatorProcess.on('close', (code) => {
      console.log(`Simulador terminado con código: ${code}`)
      simulatorProcess = null
    })

    res.json({
      status: 'ok',
      message: `Simulador iniciado con patrón ${pattern}`,
      config: { pattern, duration, frequency }
    })

  } catch (error) {
    console.error('Error starting simulator:', error)
    res.status(500).json({
      error: 'simulator_error',
      message: 'Error al iniciar simulador de hardware'
    })
  }
})

// Endpoint para detener simulador de hardware
router.post('/simulator/stop', (req, res) => {
  try {
    if (simulatorProcess) {
      simulatorProcess.kill()
      simulatorProcess = null
      res.json({
        status: 'ok',
        message: 'Simulador detenido'
      })
    } else {
      res.json({
        status: 'ok',
        message: 'No hay simulador ejecutándose'
      })
    }
  } catch (error) {
    console.error('Error stopping simulator:', error)
    res.status(500).json({
      error: 'simulator_error',
      message: 'Error al detener simulador'
    })
  }
})

// Endpoint para estado del simulador
router.get('/simulator/status', (req, res) => {
  res.json({
    status: 'ok',
    running: simulatorProcess !== null,
    pid: simulatorProcess?.pid || null
  })
})

export default router
