import express from 'express'
import { PrismaClient } from '@prisma/client'
import { validatePatient } from '../middleware/validation.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/patients - Obtener todos los pacientes
router.get('/', async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    })
    
    res.json(patients)
  } catch (error) {
    next(error)
  }
})

// GET /api/patients/:id - Obtener un paciente por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        sessions: {
          orderBy: { startTime: 'desc' },
          take: 10
        }
      }
    })
    
    if (!patient) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Paciente no encontrado'
      })
    }
    
    res.json(patient)
  } catch (error) {
    next(error)
  }
})

// POST /api/patients - Crear un nuevo paciente
router.post('/', validatePatient, async (req, res, next) => {
  try {
    const { name } = req.body
    
    const patient = await prisma.patient.create({
      data: { name: name.trim() }
    })
    
    res.status(201).json(patient)
  } catch (error) {
    next(error)
  }
})

export default router
