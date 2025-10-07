import { PrismaClient } from '@prisma/client'
import { SYNC_WINDOW_MS } from '../config/constants.js'
import socketService from './socketService.js'

const prisma = new PrismaClient()
const measurementBuffer = new Map()

class MeasurementService {
  
  async processMeasurement(sessionId, foot, weight, duration, timestamp) {
    const measurementData = {
      sessionId,
      foot,
      weight,
      duration,
      timestamp: new Date(timestamp)
    }
    
    if (!measurementBuffer.has(sessionId)) {
      measurementBuffer.set(sessionId, { left: [], right: [] })
    }
    
    const buffer = measurementBuffer.get(sessionId)
    const oppositeFoot = foot === 'left' ? 'right' : 'left'
    const pair = this.findPair(buffer[oppositeFoot], timestamp)
    
    if (pair) {
      const result = await this.createPairedMeasurements(measurementData, pair.data, foot)
      buffer[oppositeFoot] = buffer[oppositeFoot].filter(m => m.id !== pair.id)
      
      // Emitir evento Socket.IO
      socketService.emitMeasurement(result)
      
      return result
    } else {
      const bufferId = Date.now() + Math.random()
      buffer[foot].push({
        id: bufferId,
        data: measurementData,
        timestamp: new Date(timestamp)
      })
      
      setTimeout(() => {
        this.handleTimeout(sessionId, foot, bufferId)
      }, SYNC_WINDOW_MS)
      
      return { paired: false, foot, weight, sessionId }
    }
  }
  
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
  
  async createPairedMeasurements(measurement1, measurement2, firstFoot) {
    const leftMeasurement = firstFoot === 'left' ? measurement1 : measurement2
    const rightMeasurement = firstFoot === 'left' ? measurement2 : measurement1
    
    const left = await prisma.measurement.create({ data: leftMeasurement })
    const right = await prisma.measurement.create({
      data: { ...rightMeasurement, pairedMeasurementId: left.id }
    })
    
    await prisma.measurement.update({
      where: { id: left.id },
      data: { pairedMeasurementId: right.id }
    })
    
    const balance = this.calculateBalance(left.weight, right.weight)
    
    return { paired: true, left, right, balance }
  }
  
  calculateBalance(leftWeight, rightWeight) {
    const total = leftWeight + rightWeight
    const leftPercentage = (leftWeight / total) * 100
    const rightPercentage = (rightWeight / total) * 100
    const difference = Math.abs(leftPercentage - rightPercentage)
    
    let status = 'good'
    if (difference > 20) status = 'critical'
    else if (difference > 10) status = 'warning'
    
    return {
      leftWeight,
      rightWeight,
      leftPercentage: parseFloat(leftPercentage.toFixed(2)),
      rightPercentage: parseFloat(rightPercentage.toFixed(2)),
      difference: parseFloat(difference.toFixed(2)),
      status
    }
  }
  
  async handleTimeout(sessionId, foot, bufferId) {
    const buffer = measurementBuffer.get(sessionId)
    if (!buffer) return
    
    const measurement = buffer[foot].find(m => m.id === bufferId)
    if (!measurement) return
    
    const created = await prisma.measurement.create({ data: measurement.data })
    buffer[foot] = buffer[foot].filter(m => m.id !== bufferId)
    
    // Emitir evento Socket.IO para medición sin pareja
    socketService.emitMeasurement({
      paired: false,
      foot,
      weight: created.weight,
      sessionId: created.sessionId,
      measurement: created
    })
    
    console.log(`  Timeout: Medición ${foot} guardada sin pareja`)
  }
  
  clearSessionBuffer(sessionId) {
    measurementBuffer.delete(sessionId)
  }
}

export default new MeasurementService()
