import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class SessionService {
  
  // Obtener sesión activa de un paciente
  async getActiveSession(patientId) {
    return await prisma.session.findFirst({
      where: {
        patientId,
        endTime: null
      },
      include: {
        patient: true
      }
    })
  }
  
  // Calcular estadísticas de una sesión
  async calculateSessionStats(sessionId) {
    const measurements = await prisma.measurement.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    })

    if (measurements.length === 0) {
      return {
        totalMeasurements: 0,
        pairedSteps: 0,
        unpairedMeasurements: 0,
        averageBalance: null
      }
    }

    // Contar mediciones emparejadas
    const paired = measurements.filter(m => m.pairedMeasurementId !== null)
    const pairedSteps = paired.length / 2
    const unpaired = measurements.length - paired.length

    // Calcular balance promedio (solo de mediciones emparejadas)
    let totalDifference = 0
    let totalLeftWeight = 0
    let totalRightWeight = 0
    let balanceCount = 0

    const processedPairs = new Set()

    for (const measurement of measurements) {
      if (measurement.pairedMeasurementId && !processedPairs.has(measurement.id)) {
        const pair = measurements.find(m => m.id === measurement.pairedMeasurementId)
        if (pair) {
          const leftWeight = measurement.foot === 'left' ? measurement.weight : pair.weight
          const rightWeight = measurement.foot === 'right' ? measurement.weight : pair.weight
          const total = leftWeight + rightWeight
          const leftPercentage = (leftWeight / total) * 100
          const rightPercentage = (rightWeight / total) * 100
          const difference = Math.abs(leftPercentage - rightPercentage)

          totalDifference += difference
          totalLeftWeight += leftWeight
          totalRightWeight += rightWeight
          balanceCount++

          processedPairs.add(measurement.id)
          processedPairs.add(pair.id)
        }
      }
    }

    let averageBalance = null
    if (balanceCount > 0) {
      const avgLeftWeight = totalLeftWeight / balanceCount
      const avgRightWeight = totalRightWeight / balanceCount
      const totalWeight = avgLeftWeight + avgRightWeight
      const leftPercentage = parseFloat(((avgLeftWeight / totalWeight) * 100).toFixed(1))
      const rightPercentage = parseFloat(((avgRightWeight / totalWeight) * 100).toFixed(1))
      // Usar el promedio de las diferencias individuales, no la diferencia de los promedios
      const avgDifference = parseFloat((totalDifference / balanceCount).toFixed(2))

      averageBalance = {
        leftWeight: parseFloat(avgLeftWeight.toFixed(2)),
        rightWeight: parseFloat(avgRightWeight.toFixed(2)),
        leftPercentage,
        rightPercentage,
        difference: avgDifference,
        status: this.getBalanceStatus(avgDifference)
      }
    }

    return {
      totalMeasurements: measurements.length,
      totalSteps: pairedSteps,  // Alias para compatibilidad con frontend
      pairedSteps,
      unpairedMeasurements: unpaired,
      averageBalance
    }
  }
  
  // Determinar status del balance
  getBalanceStatus(averageBalance) {
    if (averageBalance === null) return null
    if (averageBalance < 10) return 'good'
    if (averageBalance < 20) return 'warning'
    return 'critical'
  }
}

export default new SessionService()
