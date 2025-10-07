import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validateSession } from '../middleware/validation.js'

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
    
    const updatedSession = await prisma.session.update({
      where: { id: parseInt(id) },
      data: {
        endTime: new Date(),
        notes: notes || null
      },
      include: {
        patient: true,
        _count: {
          select: { measurements: true }
        }
      }
    })
    
    res.json(updatedSession)
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
    
    res.json(session)
  } catch (error) {
    next(error)
  }
})

export default router
