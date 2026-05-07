#!/usr/bin/env node

import axios from 'axios'
import { program } from 'commander'

program
  .name('simulate-bipedestation-demo')
  .description('Simulación guiada para grabar una demo local de Bipedestación')
  .version('1.0.0')
  .option('-u, --url <url>', 'URL del backend', 'http://localhost:5000')
  .option('-d, --delay <seconds>', 'Segundos de espera antes de empezar a enviar datos', '5')
  .option('-i, --interval <ms>', 'Intervalo entre fotogramas de la demo', '350')
  .option('--battery-left <value>', 'Batería inicial sensor izquierdo', '92')
  .option('--battery-right <value>', 'Batería inicial sensor derecho', '89')

program.parse()

const options = program.opts()
const baseUrl = options.url
const startDelayMs = Number(options.delay) * 1000
const intervalMs = Number(options.interval)

let battery = {
  left: Number(options.batteryLeft),
  right: Number(options.batteryRight)
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sendMeasurement = async (foot, weight) => {
  battery[foot] = Math.max(0, battery[foot] - 0.03)
  const url = `${baseUrl}/api/hardware/${foot}?peso=${weight.toFixed(2)}&bat=${battery[foot].toFixed(2)}`
  await axios.get(url, { timeout: 1500 })
}

const sendFrame = async (leftWeight, rightWeight) => {
  await sendMeasurement('left', leftWeight)
  await sleep(80)
  await sendMeasurement('right', rightWeight)
}

const buildFrames = () => {
  const frames = []

  const pushStage = (label, left, right, repeats) => {
    for (let index = 0; index < repeats; index++) {
      frames.push({ label, left, right })
    }
  }

  pushStage('Subida a plataforma', 8, 6, 3)
  pushStage('Mucho peso a la derecha', 15, 27, 6)
  pushStage('Corrección progresiva', 18, 24, 4)
  pushStage('Equilibrado', 21, 21, 8)
  pushStage('Mucho peso a la izquierda', 28, 14, 6)
  pushStage('Corrección progresiva', 24, 18, 4)
  pushStage('Equilibrado final', 21, 21, 10)

  return frames
}

const main = async () => {
  console.log('\n🎬 Demo local de Bipedestación')
  console.log(`🌐 Backend: ${baseUrl}`)
  console.log(`⏳ Espera inicial: ${options.delay}s`)
  console.log('')
  console.log('Antes de que empiece el envío:')
  console.log('  1. Abre la pantalla de Bipedestación')
  console.log('  2. Configura el objetivo que quieras mostrar (por ejemplo 50/50)')
  console.log('  3. Pulsa "Iniciar ejercicio"')
  console.log('  4. Empieza a grabar el vídeo')
  console.log('')

  await sleep(startDelayMs)

  const frames = buildFrames()
  let lastLabel = ''

  for (const frame of frames) {
    if (frame.label !== lastLabel) {
      console.log(`▶ ${frame.label}`)
      lastLabel = frame.label
    }

    await sendFrame(frame.left, frame.right)
    await sleep(intervalMs)
  }

  console.log('')
  console.log('✅ Demo completada')
  console.log('Puedes finalizar el ejercicio desde la interfaz cuando termine la grabación.')
}

main().catch((error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error(`❌ No se puede conectar con ${baseUrl}`)
  } else {
    console.error('❌ Error en la demo:', error.message)
  }
  process.exit(1)
})