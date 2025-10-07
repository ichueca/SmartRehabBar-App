import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validateMeasurement } from '../middleware/validation.js'
import measurementService from '../services/measurementService.js'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/measurements/left - Recibir medición del pie izquierdo
router.post('/left', validateMeasurement, async (req, res, next) => {
  try {
    const { sessionId, weight, duration, timestamp } = req.body
    
    // Verificar que la sesión existe y está activa
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })
    
    if (!session) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Sesión no encontrada'
      })
    }
    
    if (session.endTime) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'La sesión ya está finalizada'
      })
    }
    
    // Procesar medición con el servicio
    const result = await measurementService.processMeasurement(
      sessionId,
      'left',
      weight,
      duration,
      timestamp
    )
    
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/measurements/right - Recibir medición del pie derecho
router.post('/right', validateMeasurement, async (req, res, next) => {
  try {
    const { sessionId, weight, duration, timestamp } = req.body
    
    // Verificar que la sesión existe y está activa
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })
    
    if (!session) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Sesión no encontrada'
      })
    }
    
    if (session.endTime) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'La sesión ya está finalizada'
      })
    }
    
    // Procesar medición con el servicio
    const result = await measurementService.processMeasurement(
      sessionId,
      'right',
      weight,
      duration,
      timestamp
    )
    
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/sessions/:id/measurements - Obtener mediciones de una sesión
router.get('/sessions/:id/measurements', async (req, res, next) => {
  try {
    const { id } = req.params
    
    const measurements = await prisma.measurement.findMany({
      where: { sessionId: parseInt(id) },
      orderBy: { timestamp: 'asc' }
    })
    
    res.json(measurements)
  } catch (error) {
    next(error)
  }
})

export default router
