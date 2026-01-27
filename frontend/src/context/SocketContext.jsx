import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { sessionsAPI } from '../services/api'

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [measurements, setMeasurements] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [batteryLevels, setBatteryLevels] = useState({ left: null, right: null })

  // Función para cargar sesiones activas
  const loadActiveSessions = async () => {
    try {
      const sessions = await sessionsAPI.getActive()
      setActiveSessions(sessions)
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }

  useEffect(() => {
    // Cargar sesiones activas al inicializar
    loadActiveSessions()

    // Conectar a Socket.IO
    // En producción, conectar al mismo servidor. En desarrollo, a localhost:5000
    const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('✅ Conectado a Socket.IO:', socketInstance.id)
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.IO')
      setConnected(false)
    })

    // Escuchar eventos de mediciones
    socketInstance.on('measurement:new', (data) => {
      console.log('📊 Nueva medición:', data)
      setMeasurements(prev => [data, ...prev].slice(0, 100)) // Mantener últimas 100

      // Actualizar niveles de batería
      if (data.paired) {
        if (data.left?.batteryLevel !== null && data.left?.batteryLevel !== undefined) {
          setBatteryLevels(prev => ({ ...prev, left: data.left.batteryLevel }))
        }
        if (data.right?.batteryLevel !== null && data.right?.batteryLevel !== undefined) {
          setBatteryLevels(prev => ({ ...prev, right: data.right.batteryLevel }))
        }
      } else if (data.measurement) {
        const foot = data.foot
        const level = data.measurement.batteryLevel
        if (level !== null && level !== undefined) {
          setBatteryLevels(prev => ({ ...prev, [foot]: level }))
        }
      }
    })

    // Escuchar eventos de sesiones
    socketInstance.on('session:started', (session) => {
      console.log('🟢 Sesión iniciada:', session)
      setSessions(prev => [session, ...prev])
      // Recargar sesiones activas
      loadActiveSessions()
    })

    socketInstance.on('session:ended', (session) => {
      console.log('🔴 Sesión finalizada:', session)
      setSessions(prev =>
        prev.map(s => s.id === session.id ? session : s)
      )
      // Recargar sesiones activas
      loadActiveSessions()
    })

    setSocket(socketInstance)

    // Cleanup al desmontar
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const value = {
    socket,
    connected,
    measurements,
    sessions,
    activeSessions,
    batteryLevels,
    loadActiveSessions,
    clearMeasurements: () => setMeasurements([]),
    clearSessions: () => setSessions([]),
    clearActiveSessions: () => setActiveSessions([]),
    clearBatteryLevels: () => setBatteryLevels({ left: null, right: null })
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

