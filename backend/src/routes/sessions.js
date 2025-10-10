import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validateSession } from '../middleware/validation.js'
import sessionService from '../services/sessionService.js'
import measurementService from '../services/measurementService.js'
import socketService from '../services/socketService.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/sessions - Listar todas las sesiones
router.get('/', async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        _count: {
          select: { measurements: true }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Añadir estadísticas de balance a cada sesión finalizada
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        if (session.endTime) {
          const stats = await sessionService.calculateSessionStats(session.id)
          return { ...session, statistics: stats }
        }
        return session
      })
    )

    res.json(sessionsWithStats)
  } catch (error) {
    next(error)
  }
})
// POST /api/sessions - Iniciar una nueva sesi�n
router.post('/', validateSession, async (req, res, next) => {
  try {
    const { patientId } = req.body
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })
    
    if (!patient) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Paciente no encontrado'
      })
    }
    
    const activeSession = await sessionService.getActiveSession(patientId)
    if (activeSession) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'El paciente ya tiene una sesi�n activa',
        activeSessionId: activeSession.id
      })
    }
    
    const session = await prisma.session.create({
      data: {
        patientId,
        startTime: new Date()
      },
      include: {
        patient: true
      }
    })
    
    // Emitir evento Socket.IO
    socketService.emitSessionStarted(session)
    
    res.status(201).json(session)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/sessions/:id - Finalizar una sesi�n
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
        message: 'Sesi�n no encontrada'
      })
    }
    
    if (session.endTime) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'La sesi�n ya est� finalizada'
      })
    }
    
    const stats = await sessionService.calculateSessionStats(parseInt(id))
    
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
    
    measurementService.clearSessionBuffer(parseInt(id))
    
    const result = {
      ...updatedSession,
      statistics: stats
    }
    
    // Emitir evento Socket.IO
    socketService.emitSessionEnded(result)
    
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/sessions/:id - Obtener una sesi�n
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
        message: 'Sesi�n no encontrada'
      })
    }
    
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

