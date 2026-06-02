import express from 'express'
import hardwareDebugService from '../services/hardwareDebugService.js'
import socketService from '../services/socketService.js'

const router = express.Router()

router.get('/', (req, res) => {
  const events = hardwareDebugService.getEvents(req.query)

  res.json({
    ...hardwareDebugService.getState(),
    events
  })
})

router.post('/enabled', (req, res) => {
  const { enabled } = req.body ?? {}
  const state = hardwareDebugService.setEnabled(enabled)
  socketService.emitHardwareDebugState(state)

  res.json({
    status: 'ok',
    ...state
  })
})

router.delete('/events', (req, res) => {
  const state = hardwareDebugService.clear()
  socketService.emitHardwareDebugState(state)

  res.json({
    status: 'ok',
    ...state
  })
})

export default router