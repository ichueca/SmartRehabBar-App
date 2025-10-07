import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validateMeasurement } from '../middleware/validation.js'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/measurements/left - Recibir medición del pie izquierdo
router.post('/left', validateMeasurement, async (req, res, next) => {
  try {
    const { sessionId, weight, duration, timestamp } = req.body
    
    const measurement = await prisma.measurement.create({
      data: {
        sessionId,
        foot: 'left',
        weight,
        duration: duration || null,
        timestamp: new Date(timestamp)
      }
    })
    
    res.status(201).json(measurement)
  } catch (error) {
    next(error)
  }
})

// POST /api/measurements/right - Recibir medición del pie derecho
router.post('/right', validateMeasurement, async (req, res, next) => {
  try {
    const { sessionId, weight, duration, timestamp } = req.body
    
    const measurement = await prisma.measurement.create({
      data: {
        sessionId,
        foot: 'right',
        weight,
        duration: duration || null,
        timestamp: new Date(timestamp)
      }
    })
    
    res.status(201).json(measurement)
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
