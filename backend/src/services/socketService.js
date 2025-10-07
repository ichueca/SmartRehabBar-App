import { Server } from 'socket.io'

class SocketService {
  io = null
  
  // Inicializar Socket.IO con el servidor HTTP
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
    
    this.io.on('connection', (socket) => {
      console.log(`✅ Cliente conectado: ${socket.id}`)
      
      socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`)
      })
    })
    
    console.log('🔌 Socket.IO inicializado')
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
}

export default new SocketService()
