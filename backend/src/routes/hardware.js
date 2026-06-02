import express from 'express'
import sessionService from '../services/sessionService.js'
import measurementService from '../services/measurementService.js'
import socketService from '../services/socketService.js'
import * as sitToStandService from '../services/sitToStandService.js'
import bipedestationService from '../services/bipedestationService.js'
import hardwareDebugService from '../services/hardwareDebugService.js'
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
    const { peso, bat } = req.query
    const parsedWeight = peso && !isNaN(parseFloat(peso)) ? parseFloat(peso) : null
    const parsedBattery = bat && !isNaN(parseFloat(bat)) ? parseFloat(bat) : null

    // Validar parámetros
    if (!foot || !['left', 'right'].includes(foot)) {
      recordHardwareDebug(req, {
        foot,
        weight: parsedWeight,
        batteryLevel: parsedBattery,
        mode: 'invalid',
        outcome: 'invalid_foot',
        httpStatus: 400,
        details: { message: 'foot must be "left" or "right"' }
      })

      return res.status(400).json({
        error: 'Invalid foot parameter',
        message: 'foot must be "left" or "right"'
      })
    }

    if (!peso || isNaN(parseFloat(peso))) {
      recordHardwareDebug(req, {
        foot,
        weight: parsedWeight,
        batteryLevel: parsedBattery,
        mode: 'invalid',
        outcome: 'invalid_weight',
        httpStatus: 400,
        details: { message: 'peso must be a valid number' }
      })

      return res.status(400).json({
        error: 'Invalid peso parameter',
        message: 'peso must be a valid number'
      })
    }

    const weight = parseFloat(peso)
    const batteryLevel = bat ? parseFloat(bat) : null

    // Validar nivel de batería si se proporciona
    if (batteryLevel !== null && (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100)) {
      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'invalid',
        outcome: 'invalid_battery',
        httpStatus: 400,
        details: { message: 'bat must be a number between 0 and 100' }
      })

      return res.status(400).json({
        error: 'Invalid bat parameter',
        message: 'bat must be a number between 0 and 100'
      })
    }

    const now = Date.now()

    // Verificar si hay sesión de sit-to-stand activa
    const activeSitToStand = await sitToStandService.getActiveSitToStandSession()
    if (activeSitToStand) {
      // Procesar medición para sit-to-stand
      return await processSitToStandMeasurement(req, foot, weight, batteryLevel, activeSitToStand, res)
    }

    if (bipedestationService.isActive()) {
      return processBipedestationMeasurement(req, foot, weight, batteryLevel, res)
    }

    // Verificar si hay sesión activa
    const activeSession = await sessionService.getAnyActiveSession()
    if (!activeSession) {
      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'none',
        outcome: 'no_active_session',
        httpStatus: 200,
        details: { message: 'No hay sesión activa para registrar mediciones' }
      })

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
      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'gait',
        outcome: 'filtered_time',
        httpStatus: 200,
        details: {
          sessionId: activeSession.id,
          sincePreviousMs: now - recent.timestamp,
          message: 'Medición filtrada por frecuencia (< 50ms)'
        }
      })

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
      
      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'gait',
        outcome: 'filtered_weight',
        httpStatus: 200,
        details: {
          sessionId: activeSession.id,
          previousWeight: recent.weight,
          message: 'Medición filtrada por cambio mínimo (< 1kg)'
        }
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
      weight,
      batteryLevel
    )

    // Actualizar cache de mediciones recientes
    recentMeasurements.set(recentKey, {
      timestamp: now,
      weight: weight,
      batteryLevel: batteryLevel,
      sessionId: activeSession.id
    })

    // Emitir medición individual
    socketService.emitMeasurement({
      paired: false,
      foot: foot,
      weight: measurement.weight,
      batteryLevel: measurement.batteryLevel,
      sessionId: activeSession.id,
      measurement: measurement
    })

    // Intentar emparejar con medición reciente del pie opuesto
    const oppositeFoot = foot === 'left' ? 'right' : 'left'
    const pairTimeWindow = 2000 // 2 segundos para encontrar par
    let pairingInfo = { paired: false }

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
        pairingInfo = {
          paired: true,
          pairMeasurementId: pairMeasurement.id,
          pairedFoot: oppositeFoot,
          pairedWeight: pairMeasurement.weight
        }

        console.log(`🔗 Pisada emparejada: ${foot}=${measurement.weight}kg + ${oppositeFoot}=${pairMeasurement.weight}kg`)

        // Emitir pisada completa
        socketService.emitMeasurement(pairedData)
      }
    } catch (pairError) {
      console.log('⚠️ Error al intentar emparejar:', pairError.message)
      pairingInfo = {
        paired: false,
        pairError: pairError.message
      }
      // No es crítico, la medición individual ya se guardó
    }

    recordHardwareDebug(req, {
      foot,
      weight,
      batteryLevel,
      mode: 'gait',
      outcome: 'stored',
      httpStatus: 200,
      details: {
        sessionId: activeSession.id,
        measurementId: measurement.id,
        patientName: activeSession.patient.name,
        ...pairingInfo
      }
    })
    
    res.json({
      status: 'ok',
      message: 'Medición registrada correctamente',
      sessionId: activeSession.id,
      measurementId: measurement.id,
      patientName: activeSession.patient.name
    })
    
  } catch (error) {
    recordHardwareDebug(req, {
      foot: req.params.foot ?? null,
      weight: req.query.peso ? parseFloat(req.query.peso) : null,
      batteryLevel: req.query.bat ? parseFloat(req.query.bat) : null,
      mode: 'error',
      outcome: 'exception',
      httpStatus: 500,
      details: { message: 'Error al procesar medición del hardware' },
      error
    })

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
    const activeSession = await sessionService.getAnyActiveSession()
    if (!activeSession) {
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

/**
 * Procesar medición para sesión de sit-to-stand
 */
async function processSitToStandMeasurement(req, foot, weight, batteryLevel, activeSitToStand, res) {
  try {
    const now = Date.now()
    const startTime = new Date(activeSitToStand.startTime).getTime()
    const elapsedSeconds = (now - startTime) / 1000

    // Cache para acumular mediciones de ambos pies
    const cacheKey = `sit_to_stand_${activeSitToStand.id}`
    let pendingMeasurement = recentMeasurements.get(cacheKey) || {}

    // Actualizar peso y batería del pie correspondiente
    pendingMeasurement[`weight_${foot}`] = weight
    pendingMeasurement[`battery_${foot}`] = batteryLevel
    pendingMeasurement.timestamp = now
    pendingMeasurement.elapsedSeconds = elapsedSeconds

    // Si tenemos mediciones de ambos pies (o han pasado 200ms), crear medición
    const hasLeftWeight = pendingMeasurement.weight_left !== undefined
    const hasRightWeight = pendingMeasurement.weight_right !== undefined
    const timeThreshold = 200 // 200ms para esperar el otro pie

    if ((hasLeftWeight && hasRightWeight) ||
        (pendingMeasurement.lastUpdate && (now - pendingMeasurement.lastUpdate) > timeThreshold)) {

      // Crear medición en base de datos
      const measurement = await sitToStandService.addMeasurement(
        activeSitToStand.id,
        pendingMeasurement.weight_left || null,
        pendingMeasurement.weight_right || null,
        elapsedSeconds,
        pendingMeasurement.battery_left || null,
        pendingMeasurement.battery_right || null
      )

      // Emitir evento de medición sit-to-stand
      socketService.emitSitToStandMeasurement(measurement, activeSitToStand)

      // Limpiar cache
      recentMeasurements.delete(cacheKey)

      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'sit_to_stand',
        outcome: 'stored',
        httpStatus: 200,
        details: {
          sitToStandId: activeSitToStand.id,
          elapsedSeconds,
          measurementId: measurement.id,
          hasLeftWeight,
          hasRightWeight
        }
      })

      return res.json({
        status: 'sit_to_stand_measurement',
        message: 'Medición de levantarse procesada',
        sitToStandId: activeSitToStand.id,
        elapsedSeconds: elapsedSeconds,
        measurement: measurement
      })
    } else {
      // Guardar medición parcial en cache
      pendingMeasurement.lastUpdate = now
      recentMeasurements.set(cacheKey, pendingMeasurement)

      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'sit_to_stand',
        outcome: 'partial',
        httpStatus: 200,
        details: {
          sitToStandId: activeSitToStand.id,
          elapsedSeconds,
          hasLeftWeight,
          hasRightWeight
        }
      })

      return res.json({
        status: 'sit_to_stand_partial',
        message: 'Medición parcial de levantarse guardada',
        sitToStandId: activeSitToStand.id,
        elapsedSeconds: elapsedSeconds,
        foot: foot,
        weight: weight
      })
    }

  } catch (error) {
    recordHardwareDebug(req, {
      foot,
      weight,
      batteryLevel,
      mode: 'sit_to_stand',
      outcome: 'exception',
      httpStatus: 500,
      details: {
        sitToStandId: activeSitToStand?.id ?? null,
        message: 'Error procesando medición de levantarse'
      },
      error
    })

    console.error('Error processing sit-to-stand measurement:', error)
    return res.status(500).json({
      error: 'internal_error',
      message: 'Error procesando medición de levantarse'
    })
  }
}

function processBipedestationMeasurement(req, foot, weight, batteryLevel, res) {
  try {
    const update = bipedestationService.processMeasurement(foot, weight, batteryLevel)

    if (!update) {
      recordHardwareDebug(req, {
        foot,
        weight,
        batteryLevel,
        mode: 'bipedestation',
        outcome: 'no_active_bipedestation',
        httpStatus: 400,
        details: { message: 'No hay un ejercicio de bipedestación activo' }
      })

      return res.status(400).json({
        error: 'no_active_bipedestation',
        message: 'No hay un ejercicio de bipedestación activo'
      })
    }

    socketService.emitBipedestationUpdate(update)

    recordHardwareDebug(req, {
      foot,
      weight,
      batteryLevel,
      mode: 'bipedestation',
      outcome: 'stored',
      httpStatus: 200,
      details: {
        exerciseId: update.exerciseId,
        status: update.status,
        recommendation: update.recommendation,
        message: update.message
      }
    })

    return res.json({
      status: 'bipedestation_measurement',
      message: 'Medición de bipedestación procesada',
      update
    })
  } catch (error) {
    recordHardwareDebug(req, {
      foot,
      weight,
      batteryLevel,
      mode: 'bipedestation',
      outcome: 'exception',
      httpStatus: 500,
      details: { message: 'Error procesando medición de bipedestación' },
      error
    })

    console.error('Error processing bipedestation measurement:', error)
    return res.status(500).json({
      error: 'internal_error',
      message: 'Error procesando medición de bipedestación'
    })
  }
}

function recordHardwareDebug(req, payload) {
  const entry = hardwareDebugService.addEvent({
    source: 'hardware',
    method: req.method,
    path: req.originalUrl,
    foot: payload.foot,
    raw: {
      foot: req.params.foot ?? null,
      peso: req.query.peso ?? null,
      bat: req.query.bat ?? null
    },
    parsed: {
      weight: payload.weight,
      batteryLevel: payload.batteryLevel
    },
    mode: payload.mode,
    outcome: payload.outcome,
    httpStatus: payload.httpStatus,
    details: payload.details ?? null,
    error: payload.error ? {
      message: payload.error.message,
      code: payload.error.code ?? null
    } : null
  })

  if (entry) {
    socketService.emitHardwareDebugEvent(entry)
  }
}

export default router
