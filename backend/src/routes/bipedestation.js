import express from 'express'
import bipedestationService from '../services/bipedestationService.js'
import sessionService from '../services/sessionService.js'
import * as sitToStandService from '../services/sitToStandService.js'
import socketService from '../services/socketService.js'

const router = express.Router()

router.post('/start', async (req, res) => {
  try {
    const {
      targetLeftPercentage = 50,
      mode = 'adult',
      audioEnabled = false,
      thresholds = { ok: 3, warning: 7 }
    } = req.body || {}

    const target = Number(targetLeftPercentage)
    const ok = Number(thresholds?.ok)
    const warning = Number(thresholds?.warning)

    if (Number.isNaN(target) || target < 0 || target > 100) {
      return res.status(400).json({ error: 'invalid_target', message: 'El objetivo debe estar entre 0 y 100' })
    }

    if (!['adult', 'child'].includes(mode)) {
      return res.status(400).json({ error: 'invalid_mode', message: 'El modo debe ser adult o child' })
    }

    if (Number.isNaN(ok) || Number.isNaN(warning) || ok < 0 || warning <= ok) {
      return res.status(400).json({
        error: 'invalid_thresholds',
        message: 'Los umbrales deben ser válidos y warning debe ser mayor que ok'
      })
    }

    if (bipedestationService.isActive()) {
      return res.status(400).json({
        error: 'bipedestation_already_active',
        message: 'Ya hay un ejercicio de bipedestación activo',
        status: bipedestationService.getStatus()
      })
    }

    const activeSitToStand = await sitToStandService.getActiveSitToStandSession()
    if (activeSitToStand) {
      return res.status(400).json({
        error: 'sit_to_stand_active',
        message: 'Finaliza la medición de levantarse antes de iniciar bipedestación'
      })
    }

    const activeSession = await sessionService.getAnyActiveSession()
    if (activeSession) {
      return res.status(400).json({
        error: 'session_active',
        message: 'Finaliza la sesión activa antes de iniciar bipedestación',
        activeSessionId: activeSession.id
      })
    }

    const status = bipedestationService.startExercise({
      targetLeftPercentage: target,
      mode,
      audioEnabled,
      thresholds: { ok, warning }
    })

    socketService.emitBipedestationStarted(status)

    res.json({
      success: true,
      message: 'Ejercicio de bipedestación iniciado correctamente',
      ...status
    })
  } catch (error) {
    console.error('Error starting bipedestation:', error)
    res.status(500).json({ error: 'internal_error', message: 'Error interno del servidor' })
  }
})

router.get('/status', (req, res) => {
  res.json(bipedestationService.getStatus())
})

router.post('/stop', (req, res) => {
  const status = bipedestationService.stopExercise()

  if (!status) {
    return res.status(400).json({
      error: 'no_active_bipedestation',
      message: 'No hay ningún ejercicio de bipedestación activo'
    })
  }

  socketService.emitBipedestationEnded(status)

  return res.json({
    success: true,
    message: 'Ejercicio de bipedestación finalizado correctamente',
    ...status
  })
})

export default router