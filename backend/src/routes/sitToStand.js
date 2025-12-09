/**
 * Rutas para funcionalidad Sit-to-Stand (levantarse)
 * Maneja inicio, finalización y consulta de sesiones de levantarse
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import * as sitToStandService from '../services/sitToStandService.js'
import sessionService from '../services/sessionService.js'
import socketService from '../services/socketService.js'

const prisma = new PrismaClient()

const router = express.Router()

/**
 * POST /api/sit-to-stand/start
 * Iniciar una nueva sesión de sit-to-stand
 */
router.post('/start', async (req, res) => {
  try {
    const { patientId } = req.body

    if (!patientId) {
      return res.status(400).json({
        error: 'missing_patient',
        message: 'Se requiere el ID del paciente'
      })
    }

    // Verificar que no hay otra sesión de sit-to-stand activa
    const activeSitToStand = await sitToStandService.getActiveSitToStandSession()
    if (activeSitToStand) {
      return res.status(400).json({
        error: 'sit_to_stand_already_active',
        message: 'Ya hay una medición de levantarse activa',
        activeSitToStand: activeSitToStand
      })
    }

    // Verificar si hay alguna sesión activa (pisadas o sit-to-stand)
    const anyActiveSession = await sessionService.getAnyActiveSession()
    if (anyActiveSession) {
      return res.status(400).json({
        error: 'session_already_active',
        message: 'Ya hay una sesión activa en el sistema',
        activeSession: anyActiveSession
      })
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return res.status(404).json({
        error: 'patient_not_found',
        message: 'Paciente no encontrado'
      })
    }

    // Crear nueva sesión para sit-to-stand
    const session = await prisma.session.create({
      data: {
        patientId,
        startTime: new Date()
      },
      include: {
        patient: true
      }
    })

    // Crear nueva sesión de sit-to-stand
    const sitToStandSession = await sitToStandService.createSitToStandSession(session.id)

    // Emitir evento de inicio
    socketService.emitSitToStandStarted(sitToStandSession)

    res.json({
      success: true,
      sitToStandSession: sitToStandSession,
      message: 'Sesión de levantarse iniciada correctamente'
    })

  } catch (error) {
    console.error('Error starting sit-to-stand session:', error)
    res.status(500).json({
      error: 'internal_error',
      message: 'Error interno del servidor'
    })
  }
})

/**
 * POST /api/sit-to-stand/stop
 * Finalizar la sesión de sit-to-stand activa
 */
router.post('/stop', async (req, res) => {
  try {
    // Obtener sesión activa
    const activeSitToStand = await sitToStandService.getActiveSitToStandSession()
    if (!activeSitToStand) {
      return res.status(400).json({
        error: 'no_active_sit_to_stand',
        message: 'No hay sesión de levantarse activa'
      })
    }

    // Finalizar sesión y calcular métricas
    const finalizedSession = await sitToStandService.finalizeSitToStandSession(activeSitToStand.id)

    // Emitir evento de finalización
    socketService.emitSitToStandEnded(finalizedSession)

    res.json({
      success: true,
      sitToStandSession: finalizedSession,
      message: 'Sesión de levantarse finalizada correctamente'
    })

  } catch (error) {
    console.error('Error stopping sit-to-stand session:', error)
    res.status(500).json({
      error: 'internal_error',
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/sit-to-stand/active
 * Obtener la sesión de sit-to-stand activa
 */
router.get('/active', async (req, res) => {
  try {
    const activeSitToStand = await sitToStandService.getActiveSitToStandSession()
    
    res.json(activeSitToStand || null)

  } catch (error) {
    console.error('Error getting active sit-to-stand session:', error)
    res.status(500).json({
      error: 'internal_error',
      message: 'Error interno del servidor'
    })
  }
})

/**
 * POST /api/sit-to-stand/:id/finish
 * Finalizar una sesión de sit-to-stand específica
 */
router.post('/:id/finish', async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'invalid_id',
        message: 'ID de sesión inválido'
      })
    }

    // Verificar que la sesión existe y está activa
    const sitToStandSession = await sitToStandService.getSitToStandSessionById(id)

    if (!sitToStandSession) {
      return res.status(404).json({
        error: 'session_not_found',
        message: 'Sesión de levantarse no encontrada'
      })
    }

    if (sitToStandSession.status !== 'active') {
      return res.status(400).json({
        error: 'session_not_active',
        message: 'La sesión ya está finalizada'
      })
    }

    // Finalizar sesión y calcular métricas
    const finalizedSession = await sitToStandService.finalizeSitToStandSession(parseInt(id))

    // Emitir evento de finalización
    socketService.emitSitToStandEnded(finalizedSession)

    res.json(finalizedSession)

  } catch (error) {
    console.error('Error finishing sit-to-stand session:', error)
    res.status(500).json({
      error: 'internal_error',
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/sit-to-stand/:id
 * Obtener sesión de sit-to-stand por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'invalid_id',
        message: 'ID de sesión inválido'
      })
    }

    const sitToStandSession = await sitToStandService.getSitToStandSessionById(id)

    if (!sitToStandSession) {
      return res.status(404).json({
        error: 'session_not_found',
        message: 'Sesión de levantarse no encontrada'
      })
    }

    res.json(sitToStandSession)

  } catch (error) {
    console.error('Error getting sit-to-stand session:', error)
    res.status(500).json({
      error: 'internal_error',
      message: 'Error interno del servidor'
    })
  }
})

export default router
