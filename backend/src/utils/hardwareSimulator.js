import axios from 'axios'

/**
 * Simulador de Hardware - Genera patrones realistas de pisada
 * Simula el comportamiento de sensores de peso conectados a microcontroladores
 */
class HardwareSimulator {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl
    this.isRunning = false
    this.intervalId = null
    this.currentStep = 0
    this.config = {
      frequency: 15, // Hz - mediciones por segundo
      stepDuration: 1000, // ms - duración de una pisada
      restDuration: 500, // ms - tiempo entre pisadas
      baseWeight: { left: 70, right: 68 }, // kg - peso base
      patterns: {
        normal: { variation: 5, asymmetry: 0.1 },
        unbalanced: { variation: 8, asymmetry: 0.3 },
        limping: { variation: 10, asymmetry: 0.5 }
      }
    }
    this.currentPattern = 'normal'
    this.stepPhase = 'rest' // 'rest', 'stepping', 'peak', 'release'
    this.stepStartTime = 0
    this.lastMeasurementTime = { left: 0, right: 0 }
  }

  /**
   * Configurar simulador
   */
  configure(options = {}) {
    this.config = { ...this.config, ...options }
    if (options.pattern && this.config.patterns[options.pattern]) {
      this.currentPattern = options.pattern
    }
  }

  /**
   * Iniciar simulación
   */
  start() {
    if (this.isRunning) {
      console.log('Simulador ya está ejecutándose')
      return
    }

    console.log(`🚀 Iniciando simulador de hardware`)
    console.log(`📊 Configuración:`)
    console.log(`   - Frecuencia: ${this.config.frequency} Hz`)
    console.log(`   - Patrón: ${this.currentPattern}`)
    console.log(`   - URL: ${this.baseUrl}`)
    console.log(`   - Peso base: Izq=${this.config.baseWeight.left}kg, Der=${this.config.baseWeight.right}kg`)

    this.isRunning = true
    this.stepStartTime = Date.now()
    
    // Intervalo basado en la frecuencia configurada
    const intervalMs = 1000 / this.config.frequency
    this.intervalId = setInterval(() => {
      this.generateMeasurement()
    }, intervalMs)
  }

  /**
   * Detener simulación
   */
  stop() {
    if (!this.isRunning) {
      console.log('Simulador no está ejecutándose')
      return
    }

    console.log('🛑 Deteniendo simulador de hardware')
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Generar medición basada en patrón de pisada realista
   */
  generateMeasurement() {
    const now = Date.now()
    const timeSinceStepStart = now - this.stepStartTime
    const pattern = this.config.patterns[this.currentPattern]

    // Determinar fase de la pisada
    if (timeSinceStepStart < this.config.stepDuration) {
      // Durante la pisada
      this.stepPhase = this.getStepPhase(timeSinceStepStart)
      
      // Generar pesos para ambos pies
      const weights = this.calculateStepWeights(timeSinceStepStart, pattern)
      
      // Enviar mediciones (no siempre ambos pies al mismo tiempo)
      this.sendMeasurements(weights, now)
      
    } else if (timeSinceStepStart < this.config.stepDuration + this.config.restDuration) {
      // Período de descanso entre pisadas
      this.stepPhase = 'rest'
      // No enviar mediciones durante el descanso
      
    } else {
      // Iniciar nueva pisada
      this.currentStep++
      this.stepStartTime = now
      console.log(`👣 Pisada #${this.currentStep} - Patrón: ${this.currentPattern}`)
    }
  }

  /**
   * Determinar fase dentro de una pisada
   */
  getStepPhase(timeInStep) {
    const progress = timeInStep / this.config.stepDuration
    
    if (progress < 0.2) return 'initial'      // Contacto inicial
    if (progress < 0.4) return 'loading'     // Carga progresiva
    if (progress < 0.6) return 'peak'        // Pico de carga
    if (progress < 0.8) return 'unloading'   // Descarga
    return 'release'                         // Liberación
  }

  /**
   * Calcular pesos realistas basados en fase de pisada
   */
  calculateStepWeights(timeInStep, pattern) {
    const progress = timeInStep / this.config.stepDuration
    
    // Curva de carga realista (campana asimétrica)
    let loadFactor
    if (progress < 0.3) {
      // Carga progresiva
      loadFactor = Math.sin(progress * Math.PI / 0.3) * 0.7
    } else if (progress < 0.7) {
      // Pico sostenido
      loadFactor = 0.7 + Math.sin((progress - 0.3) * Math.PI / 0.4) * 0.3
    } else {
      // Descarga rápida
      loadFactor = Math.cos((progress - 0.7) * Math.PI / 0.6) * 0.8
    }

    // Aplicar variación aleatoria
    const variation = (Math.random() - 0.5) * pattern.variation
    
    // Calcular pesos con asimetría del patrón
    const leftWeight = this.config.baseWeight.left * (1 - pattern.asymmetry) * loadFactor + variation
    const rightWeight = this.config.baseWeight.right * (1 + pattern.asymmetry) * loadFactor + variation

    return {
      left: Math.max(0, leftWeight),
      right: Math.max(0, rightWeight)
    }
  }

  /**
   * Enviar mediciones al backend
   */
  async sendMeasurements(weights, timestamp) {
    const promises = []

    // Enviar medición del pie izquierdo
    if (weights.left > 5 && (timestamp - this.lastMeasurementTime.left) > 30) {
      promises.push(this.sendMeasurement('left', weights.left))
      this.lastMeasurementTime.left = timestamp
    }

    // Enviar medición del pie derecho
    if (weights.right > 5 && (timestamp - this.lastMeasurementTime.right) > 30) {
      promises.push(this.sendMeasurement('right', weights.right))
      this.lastMeasurementTime.right = timestamp
    }

    // Ejecutar envíos en paralelo
    if (promises.length > 0) {
      try {
        await Promise.all(promises)
      } catch (error) {
        // Continuar simulación aunque falle el envío
        if (error.code !== 'ECONNREFUSED') {
          console.error('Error enviando medición:', error.message)
        }
      }
    }
  }

  /**
   * Enviar medición individual
   */
  async sendMeasurement(foot, weight) {
    const url = `${this.baseUrl}/api/hardware/${foot}?peso=${weight.toFixed(2)}`
    
    try {
      const response = await axios.get(url, { timeout: 1000 })
      
      if (response.data.status === 'ok') {
        console.log(`✅ ${foot}: ${weight.toFixed(1)}kg → ${response.data.patientName}`)
      } else if (response.data.status === 'no_active_session') {
        console.log(`⚠️  No hay sesión activa`)
      }
      // No mostrar mensajes para filtros (demasiado verbose)
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Servidor no disponible en ${this.baseUrl}`)
        this.stop()
      } else {
        throw error
      }
    }
  }

  /**
   * Cambiar patrón de simulación
   */
  setPattern(pattern) {
    if (this.config.patterns[pattern]) {
      this.currentPattern = pattern
      console.log(`🔄 Patrón cambiado a: ${pattern}`)
    } else {
      console.log(`❌ Patrón desconocido: ${pattern}`)
    }
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      currentPattern: this.currentPattern,
      stepPhase: this.stepPhase,
      config: this.config
    }
  }
}

export default HardwareSimulator
