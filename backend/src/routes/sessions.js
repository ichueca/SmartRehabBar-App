import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validateSession } from '../middleware/validation.js'
import sessionService from '../services/sessionService.js'
import measurementService from '../services/measurementService.js'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/sessions - Iniciar una nueva sesión
router.post('/', validateSession, async (req, res, next) => {
  try {
    const { patientId } = req.body
    
    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })
    
    if (!patient) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Paciente no encontrado'
      })
    }
    
    // Verificar que no hay sesión activa
    const activeSession = await sessionService.getActiveSession(patientId)
    if (activeSession) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'El paciente ya tiene una sesión activa',
        activeSessionId: activeSession.id
      })
    }
    
    // Crear la sesión
    const session = await prisma.session.create({
      data: {
        patientId,
        startTime: new Date()
      },
      include: {
        patient: true
      }
    })
    
    res.status(201).json(session)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/sessions/:id - Finalizar una sesión
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { notes } = req.body
    
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) }
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
    
    // Calcular estadísticas antes de finalizar
    const stats = await sessionService.calculateSessionStats(parseInt(id))
    
    // Finalizar sesión
    const updatedSession = await prisma.session.update({
      where: { id: parseInt(id) },
      data: {
        endTime: new Date(),
        notes: notes || null
      },
      include: {
        patient: true
      }
    })
    
    // Limpiar buffer de mediciones
    measurementService.clearSessionBuffer(parseInt(id))
    
    res.json({
      ...updatedSession,
      statistics: stats
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/sessions/:id - Obtener una sesión
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        measurements: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })
    
    if (!session) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Sesión no encontrada'
      })
    }
    
    // Calcular estadísticas
    const stats = await sessionService.calculateSessionStats(parseInt(id))
    
    res.json({
      ...session,
      statistics: stats
    })
  } catch (error) {
    next(error)
  }
})

export default router
