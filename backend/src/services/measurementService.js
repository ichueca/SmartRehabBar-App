import { PrismaClient } from '@prisma/client'
import { SYNC_WINDOW_MS } from '../config/constants.js'

const prisma = new PrismaClient()

// Buffer temporal para mediciones pendientes de sincronización
// Estructura: { sessionId: { left: [...], right: [...] } }
const measurementBuffer = new Map()

class MeasurementService {
  
  // Agregar medición y buscar pareja
  async processMeasurement(sessionId, foot, weight, duration, timestamp) {
    const measurementData = {
      sessionId,
      foot,
      weight,
      duration,
      timestamp: new Date(timestamp)
    }
    
    // Inicializar buffer para esta sesión si no existe
    if (!measurementBuffer.has(sessionId)) {
      measurementBuffer.set(sessionId, { left: [], right: [] })
    }
    
    const buffer = measurementBuffer.get(sessionId)
    const oppositeFoot = foot === 'left' ? 'right' : 'left'
    
    // Buscar pareja en el buffer del pie opuesto
    const pair = this.findPair(buffer[oppositeFoot], timestamp)
    
    if (pair) {
      // Encontramos pareja! Crear ambas mediciones emparejadas
      const result = await this.createPairedMeasurements(
        measurementData,
        pair.data,
        foot
      )
      
      // Eliminar del buffer
      buffer[oppositeFoot] = buffer[oppositeFoot].filter(m => m.id !== pair.id)
      
      return result
    } else {
      // No hay pareja, agregar al buffer
      const bufferId = Date.now() + Math.random()
      buffer[foot].push({
        id: bufferId,
        data: measurementData,
        timestamp: new Date(timestamp)
      })
      
      // Configurar timeout para limpiar si no encuentra pareja
      setTimeout(() => {
        this.handleTimeout(sessionId, foot, bufferId)
      }, SYNC_WINDOW_MS)
      
      return { paired: false, foot, weight }
    }
  }
  
  // Buscar medición pareja dentro de la ventana de tiempo
  findPair(bufferArray, timestamp) {
    const currentTime = new Date(timestamp).getTime()
    
    for (const item of bufferArray) {
      const itemTime = item.timestamp.getTime()
      const timeDiff = Math.abs(currentTime - itemTime)
      
      if (timeDiff <= SYNC_WINDOW_MS) {
        return item
      }
    }
    
    return null
  }
  
  // Crear mediciones emparejadas en la base de datos
  async createPairedMeasurements(measurement1, measurement2, firstFoot) {
    const leftMeasurement = firstFoot === 'left' ? measurement1 : measurement2
    const rightMeasurement = firstFoot === 'left' ? measurement2 : measurement1
    
    // Crear medición izquierda
    const left = await prisma.measurement.create({
      data: leftMeasurement
    })
    
    // Crear medición derecha con referencia a la izquierda
    const right = await prisma.measurement.create({
      data: {
        ...rightMeasurement,
        pairedMeasurementId: left.id
      }
    })
    
    // Actualizar la izquierda con referencia a la derecha
    await prisma.measurement.update({
      where: { id: left.id },
      data: { pairedMeasurementId: right.id }
    })
    
    // Calcular balance
    const balance = this.calculateBalance(left.weight, right.weight)
    
    return {
      paired: true,
      left,
      right,
      balance
    }
  }
  
  // Calcular distribución de peso y balance
  calculateBalance(leftWeight, rightWeight) {
    const total = leftWeight + rightWeight
    const leftPercentage = (leftWeight / total) * 100
    const rightPercentage = (rightWeight / total) * 100
    const difference = Math.abs(leftPercentage - rightPercentage)
    
    let status = 'good'
    if (difference > 20) {
      status = 'critical'
    } else if (difference > 10) {
      status = 'warning'
    }
    
    return {
      leftWeight,
      rightWeight,
      leftPercentage: parseFloat(leftPercentage.toFixed(2)),
      rightPercentage: parseFloat(rightPercentage.toFixed(2)),
      difference: parseFloat(difference.toFixed(2)),
      status
    }
  }
  
  // Manejar timeout de medición sin pareja
  async handleTimeout(sessionId, foot, bufferId) {
    const buffer = measurementBuffer.get(sessionId)
    if (!buffer) return
    
    const measurement = buffer[foot].find(m => m.id === bufferId)
    if (!measurement) return
    
    // Crear medición individual (sin pareja)
    await prisma.measurement.create({
      data: measurement.data
    })
    
    // Eliminar del buffer
    buffer[foot] = buffer[foot].filter(m => m.id !== bufferId)
    
    console.log(`  Timeout: Medición ${foot} guardada sin pareja`)
  }
  
  // Limpiar buffer de una sesión (cuando se finaliza)
  clearSessionBuffer(sessionId) {
    measurementBuffer.delete(sessionId)
  }
}

export default new MeasurementService()
