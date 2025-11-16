#!/usr/bin/env node

import HardwareSimulator from '../utils/hardwareSimulator.js'
import { program } from 'commander'

// Configurar CLI
program
  .name('simulate-hardware')
  .description('Simulador de sensores de hardware para SmartRehabBar')
  .version('1.0.0')

program
  .option('-u, --url <url>', 'URL del servidor backend', 'http://localhost:5000')
  .option('-f, --frequency <hz>', 'Frecuencia de mediciones (Hz)', '15')
  .option('-p, --pattern <pattern>', 'Patrón de pisada (normal|unbalanced|limping)', 'normal')
  .option('-d, --duration <seconds>', 'Duración de la simulación en segundos (0 = infinito)', '0')
  .option('--left-weight <kg>', 'Peso base pie izquierdo', '70')
  .option('--right-weight <kg>', 'Peso base pie derecho', '68')
  .option('--step-duration <ms>', 'Duración de cada pisada en ms', '1000')
  .option('--rest-duration <ms>', 'Tiempo entre pisadas en ms', '500')
  .option('--auto-stop', 'Detener automáticamente sin interacción del usuario', false)

program.parse()

const options = program.opts()

// Crear y configurar simulador
const simulator = new HardwareSimulator(options.url)

simulator.configure({
  frequency: parseInt(options.frequency),
  stepDuration: parseInt(options.stepDuration),
  restDuration: parseInt(options.restDuration),
  baseWeight: {
    left: parseFloat(options.leftWeight),
    right: parseFloat(options.rightWeight)
  },
  pattern: options.pattern
})

// Manejar señales de interrupción
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal de interrupción')
  simulator.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal de terminación')
  simulator.stop()
  process.exit(0)
})

// Mostrar ayuda interactiva
console.log('\n📋 Comandos disponibles durante la simulación:')
console.log('  - Ctrl+C: Detener simulación')
console.log('  - n: Cambiar a patrón normal')
console.log('  - u: Cambiar a patrón desequilibrado')
console.log('  - l: Cambiar a patrón cojera')
console.log('  - s: Mostrar estado')
console.log('  - h: Mostrar esta ayuda')
console.log('')

// Configurar entrada interactiva (solo si no es auto-stop)
if (process.stdin.isTTY && !options.autoStop) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  
  process.stdin.on('data', (key) => {
    switch (key.toLowerCase()) {
      case 'n':
        simulator.setPattern('normal')
        break
      case 'u':
        simulator.setPattern('unbalanced')
        break
      case 'l':
        simulator.setPattern('limping')
        break
      case 's':
        const status = simulator.getStatus()
        console.log('\n📊 Estado actual:')
        console.log(`   - Ejecutándose: ${status.isRunning}`)
        console.log(`   - Pisadas: ${status.currentStep}`)
        console.log(`   - Patrón: ${status.currentPattern}`)
        console.log(`   - Fase: ${status.stepPhase}`)
        console.log(`   - Frecuencia: ${status.config.frequency} Hz`)
        console.log('')
        break
      case 'h':
        console.log('\n📋 Comandos disponibles:')
        console.log('  - n: Patrón normal')
        console.log('  - u: Patrón desequilibrado')
        console.log('  - l: Patrón cojera')
        console.log('  - s: Mostrar estado')
        console.log('  - h: Mostrar ayuda')
        console.log('  - Ctrl+C: Salir')
        console.log('')
        break
      case '\u0003': // Ctrl+C
        simulator.stop()
        process.exit(0)
        break
    }
  })
}

// Iniciar simulación
simulator.start()

// Detener automáticamente si se especificó duración
if (parseInt(options.duration) > 0) {
  setTimeout(() => {
    console.log(`\n⏰ Tiempo de simulación completado (${options.duration}s)`)
    simulator.stop()
    process.exit(0)
  }, parseInt(options.duration) * 1000)
}
