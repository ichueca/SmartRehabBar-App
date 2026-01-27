/**
 * Servicio para gestionar sesiones de Sit-to-Stand (levantarse)
 * Maneja la creación, mediciones y finalización de pruebas de levantarse
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Crear una nueva sesión de sit-to-stand
 */
export async function createSitToStandSession(sessionId) {
  try {
    const sitToStandSession = await prisma.sitToStandSession.create({
      data: {
        sessionId: sessionId,
        startTime: new Date(),
        status: 'active'
      },
      include: {
        session: {
          include: {
            patient: true
          }
        }
      }
    })

    return sitToStandSession
  } catch (error) {
    console.error('Error creating sit-to-stand session:', error)
    throw error
  }
}

/**
 * Obtener sesión activa de sit-to-stand
 */
export async function getActiveSitToStandSession() {
  try {
    const activeSitToStand = await prisma.sitToStandSession.findFirst({
      where: {
        status: 'active'
      },
      include: {
        session: {
          include: {
            patient: true
          }
        },
        measurements: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    })

    return activeSitToStand
  } catch (error) {
    console.error('Error getting active sit-to-stand session:', error)
    throw error
  }
}

/**
 * Añadir medición a sesión de sit-to-stand
 */
export async function addMeasurement(sitToStandSessionId, weightLeft, weightRight, elapsedSeconds, batteryLevelLeft = null, batteryLevelRight = null) {
  try {
    const measurement = await prisma.sitToStandMeasurement.create({
      data: {
        sitToStandSessionId: sitToStandSessionId,
        timestamp: new Date(),
        weightLeft: weightLeft,
        weightRight: weightRight,
        batteryLevelLeft: batteryLevelLeft !== null ? parseFloat(batteryLevelLeft) : null,
        batteryLevelRight: batteryLevelRight !== null ? parseFloat(batteryLevelRight) : null,
        elapsedSeconds: elapsedSeconds
      }
    })

    return measurement
  } catch (error) {
    console.error('Error adding sit-to-stand measurement:', error)
    throw error
  }
}

/**
 * Finalizar sesión de sit-to-stand y calcular métricas
 */
export async function finalizeSitToStandSession(sitToStandSessionId) {
  try {
    // Obtener todas las mediciones
    const measurements = await prisma.sitToStandMeasurement.findMany({
      where: {
        sitToStandSessionId: sitToStandSessionId
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    if (measurements.length === 0) {
      throw new Error('No measurements found for sit-to-stand session')
    }

    // Calcular métricas
    const startTime = measurements[0].timestamp
    const endTime = measurements[measurements.length - 1].timestamp
    const durationSeconds = (endTime - startTime) / 1000

    // Calcular pesos máximos
    const maxWeightLeft = Math.max(...measurements.map(m => m.weightLeft || 0))
    const maxWeightRight = Math.max(...measurements.map(m => m.weightRight || 0))

    // Calcular simetría (diferencia porcentual entre pesos máximos)
    const totalMaxWeight = maxWeightLeft + maxWeightRight
    const symmetryPercentage = totalMaxWeight > 0 
      ? 100 - (Math.abs(maxWeightLeft - maxWeightRight) / totalMaxWeight * 100)
      : 0

    // Actualizar sesión con métricas calculadas
    const updatedSession = await prisma.sitToStandSession.update({
      where: {
        id: sitToStandSessionId
      },
      data: {
        endTime: new Date(),
        status: 'completed',
        durationSeconds: durationSeconds,
        maxWeightLeft: maxWeightLeft,
        maxWeightRight: maxWeightRight,
        symmetryPercentage: symmetryPercentage
      },
      include: {
        session: {
          include: {
            patient: true
          }
        },
        measurements: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    })

    return updatedSession
  } catch (error) {
    console.error('Error finalizing sit-to-stand session:', error)
    throw error
  }
}

/**
 * Obtener sesión de sit-to-stand por ID
 */
export async function getSitToStandSessionById(id) {
  try {
    const sitToStandSession = await prisma.sitToStandSession.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        session: {
          include: {
            patient: true
          }
        },
        measurements: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    })

    return sitToStandSession
  } catch (error) {
    console.error('Error getting sit-to-stand session by ID:', error)
    throw error
  }
}
