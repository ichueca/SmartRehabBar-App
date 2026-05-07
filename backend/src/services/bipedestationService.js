const DEFAULT_THRESHOLDS = {
  ok: 3,
  warning: 7
}

const DEFAULT_MIN_TOTAL_WEIGHT = 8
const DEFAULT_SMOOTHING_WINDOW_MS = 400

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

class BipedestationService {
  activeExercise = null
  latestUpdate = null
  history = { left: [], right: [] }
  latestMeasurements = {
    left: { weight: 0, batteryLevel: null, timestamp: null },
    right: { weight: 0, batteryLevel: null, timestamp: null }
  }

  startExercise(config = {}) {
    const targetLeftPercentage = clamp(Number(config.targetLeftPercentage ?? 50), 0, 100)
    const okThreshold = Number(config.thresholds?.ok ?? DEFAULT_THRESHOLDS.ok)
    const warningThreshold = Number(config.thresholds?.warning ?? DEFAULT_THRESHOLDS.warning)

    this.activeExercise = {
      id: Date.now(),
      status: 'active',
      startedAt: new Date().toISOString(),
      mode: config.mode === 'child' ? 'child' : 'adult',
      audioEnabled: Boolean(config.audioEnabled),
      targetLeftPercentage,
      targetRightPercentage: 100 - targetLeftPercentage,
      thresholds: {
        ok: okThreshold,
        warning: warningThreshold
      },
      minTotalWeight: Number(config.minTotalWeight ?? DEFAULT_MIN_TOTAL_WEIGHT),
      smoothingWindowMs: Number(config.smoothingWindowMs ?? DEFAULT_SMOOTHING_WINDOW_MS)
    }

    this.latestUpdate = null
    this.history = { left: [], right: [] }
    this.latestMeasurements = {
      left: { weight: 0, batteryLevel: null, timestamp: null },
      right: { weight: 0, batteryLevel: null, timestamp: null }
    }

    return this.getStatus()
  }

  stopExercise() {
    if (!this.activeExercise) {
      return null
    }

    const finishedExercise = {
      ...this.activeExercise,
      status: 'stopped',
      stoppedAt: new Date().toISOString()
    }

    const result = {
      active: false,
      exercise: finishedExercise,
      latestUpdate: this.latestUpdate
    }

    this.activeExercise = null
    this.latestUpdate = null
    this.history = { left: [], right: [] }

    return result
  }

  isActive() {
    return Boolean(this.activeExercise)
  }

  getStatus() {
    return {
      active: this.isActive(),
      exercise: this.activeExercise,
      latestUpdate: this.latestUpdate
    }
  }

  processMeasurement(foot, weight, batteryLevel = null) {
    if (!this.activeExercise) {
      return null
    }

    const now = Date.now()
    const numericWeight = Math.max(0, Number(weight) || 0)

    this.latestMeasurements[foot] = {
      weight: numericWeight,
      batteryLevel,
      timestamp: now
    }

    this.history[foot].push({ value: numericWeight, timestamp: now })
    this.pruneHistory(now)

    const leftWeight = this.getSmoothedWeight('left')
    const rightWeight = this.getSmoothedWeight('right')
    const totalWeight = leftWeight + rightWeight

    const payload = {
      exerciseId: this.activeExercise.id,
      timestamp: new Date(now).toISOString(),
      mode: this.activeExercise.mode,
      audioEnabled: this.activeExercise.audioEnabled,
      target: {
        leftPercentage: this.activeExercise.targetLeftPercentage,
        rightPercentage: this.activeExercise.targetRightPercentage
      },
      thresholds: this.activeExercise.thresholds,
      weights: {
        left: Number(leftWeight.toFixed(2)),
        right: Number(rightWeight.toFixed(2)),
        total: Number(totalWeight.toFixed(2))
      },
      batteryLevels: {
        left: this.latestMeasurements.left.batteryLevel,
        right: this.latestMeasurements.right.batteryLevel
      }
    }

    if (totalWeight < this.activeExercise.minTotalWeight) {
      this.latestUpdate = {
        ...payload,
        status: 'waiting_for_user',
        recommendation: 'step_on_platform',
        message: 'Súbete a la plataforma',
        voiceMessage: 'Súbete a la plataforma'
      }

      return this.latestUpdate
    }

    const leftPercentage = (leftWeight / totalWeight) * 100
    const rightPercentage = 100 - leftPercentage
    const deltaLeft = leftPercentage - this.activeExercise.targetLeftPercentage
    const absoluteDifference = Math.abs(deltaLeft)

    let status = 'ok'
    let recommendation = 'balanced'
    let message = 'Equilibrado'
    let voiceMessage = 'Equilibrado'

    if (absoluteDifference > this.activeExercise.thresholds.ok) {
      const needsMoreLeft = deltaLeft < 0
      recommendation = needsMoreLeft ? 'more_left' : 'more_right'
      status = absoluteDifference > this.activeExercise.thresholds.warning ? 'large' : 'slight'
      message = status === 'large'
        ? `Pon más peso en el pie ${needsMoreLeft ? 'izquierdo' : 'derecho'}`
        : `Pon un poco más de peso en el pie ${needsMoreLeft ? 'izquierdo' : 'derecho'}`
      voiceMessage = message
    }

    this.latestUpdate = {
      ...payload,
      distribution: {
        leftPercentage: Number(leftPercentage.toFixed(1)),
        rightPercentage: Number(rightPercentage.toFixed(1)),
        differenceFromTarget: Number(absoluteDifference.toFixed(1))
      },
      status,
      recommendation,
      message,
      voiceMessage
    }

    return this.latestUpdate
  }

  pruneHistory(now) {
    const maxAge = this.activeExercise?.smoothingWindowMs ?? DEFAULT_SMOOTHING_WINDOW_MS
    for (const foot of ['left', 'right']) {
      this.history[foot] = this.history[foot].filter(entry => now - entry.timestamp <= maxAge)
    }
  }

  getSmoothedWeight(foot) {
    const entries = this.history[foot]
    if (entries.length === 0) {
      return this.latestMeasurements[foot].weight || 0
    }

    const total = entries.reduce((sum, entry) => sum + entry.value, 0)
    return total / entries.length
  }
}

export default new BipedestationService()