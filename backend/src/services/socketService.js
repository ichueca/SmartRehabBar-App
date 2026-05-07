import { Server } from 'socket.io'

class SocketService {
  io = null
  
  // Inicializar Socket.IO con el servidor HTTP
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Permitir todos los orígenes en desarrollo
        methods: ['GET', 'POST']
      }
    })
    
    this.io.on('connection', (socket) => {
      console.log(` Cliente conectado: ${socket.id}`)
      
      socket.on('disconnect', () => {
        console.log(` Cliente desconectado: ${socket.id}`)
      })
    })
    
    console.log(' Socket.IO inicializado')
  }
  
  // Emitir evento de nueva medición
  emitMeasurement(data) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }
    
    this.io.emit('measurement:new', data)
    console.log(` Emitido: measurement:new`, {
      paired: data.paired,
      sessionId: data.left?.sessionId || data.right?.sessionId || data.sessionId
    })
  }
  
  // Emitir evento de sesión iniciada
  emitSessionStarted(session) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }
    
    this.io.emit('session:started', session)
    console.log(` Emitido: session:started`, { sessionId: session.id })
  }
  
  // Emitir evento de sesión finalizada
  emitSessionEnded(session) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('session:ended', session)
    console.log(` Emitido: session:ended`, { sessionId: session.id })
  }

  // Emitir evento de sit-to-stand iniciado
  emitSitToStandStarted(sitToStandSession) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('sit-to-stand:started', sitToStandSession)
    console.log(` Emitido: sit-to-stand:started`, {
      sitToStandId: sitToStandSession.id,
      sessionId: sitToStandSession.sessionId
    })
  }

  // Emitir evento de medición de sit-to-stand
  emitSitToStandMeasurement(measurement, sitToStandSession) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('sit-to-stand:measurement', {
      measurement: measurement,
      sitToStandSession: sitToStandSession
    })
    console.log(` Emitido: sit-to-stand:measurement`, {
      sitToStandId: sitToStandSession.id,
      elapsedSeconds: measurement.elapsedSeconds
    })
  }

  // Emitir evento de sit-to-stand finalizado
  emitSitToStandEnded(sitToStandSession) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('sit-to-stand:ended', sitToStandSession)
    console.log(` Emitido: sit-to-stand:ended`, {
      sitToStandId: sitToStandSession.id,
      durationSeconds: sitToStandSession.durationSeconds,
      symmetryPercentage: sitToStandSession.symmetryPercentage
    })
  }

  emitBipedestationStarted(status) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('bipedestation:started', status)
    console.log(' Emitido: bipedestation:started', {
      active: status.active,
      exerciseId: status.exercise?.id
    })
  }

  emitBipedestationUpdate(update) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('bipedestation:update', update)
    console.log(' Emitido: bipedestation:update', {
      exerciseId: update.exerciseId,
      status: update.status,
      recommendation: update.recommendation
    })
  }

  emitBipedestationEnded(status) {
    if (!this.io) {
      console.error('Socket.IO no está inicializado')
      return
    }

    this.io.emit('bipedestation:ended', status)
    console.log(' Emitido: bipedestation:ended', {
      exerciseId: status.exercise?.id
    })
  }
}

export default new SocketService()
