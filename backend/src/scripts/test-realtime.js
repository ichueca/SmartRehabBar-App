#!/usr/bin/env node

import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

async function testRealtimeUpdates() {
  console.log('🔄 Prueba de actualizaciones en tiempo real\n')
  
  try {
    // 1. Verificar sesión activa
    console.log('🔍 Verificando sesión activa...')
    const activeSessionsResponse = await axios.get(`${BASE_URL}/api/sessions/active`)
    
    if (!activeSessionsResponse.data || activeSessionsResponse.data.length === 0) {
      console.log('❌ No hay sesión activa.')
      console.log('💡 Ve al frontend (http://localhost:3000) e inicia una sesión primero.')
      return
    }
    
    const activeSession = activeSessionsResponse.data[0]
    console.log(`✅ Sesión activa: ${activeSession.patient.name} (ID: ${activeSession.id})\n`)
    
    // 2. Limpiar cache
    console.log('🧹 Limpiando cache...')
    await axios.delete(`${BASE_URL}/api/hardware/cache`)
    
    // 3. Enviar mediciones con intervalos para ver actualizaciones
    console.log('📊 Enviando mediciones cada 2 segundos...')
    console.log('💡 Ve al frontend para observar las actualizaciones en tiempo real\n')
    
    const testMeasurements = [
      { foot: 'left', weight: 75.2 },
      { foot: 'right', weight: 72.8 },
      { foot: 'left', weight: 76.5 },
      { foot: 'right', weight: 73.1 },
      { foot: 'left', weight: 74.8 },
      { foot: 'right', weight: 71.9 },
      { foot: 'left', weight: 77.1 },
      { foot: 'right', weight: 74.3 }
    ]
    
    for (let i = 0; i < testMeasurements.length; i++) {
      const { foot, weight } = testMeasurements[i]
      
      console.log(`   ${i + 1}. Enviando ${foot}: ${weight}kg`)
      const response = await axios.get(`${BASE_URL}/api/hardware/${foot}?peso=${weight}`)
      
      if (response.data.status === 'ok') {
        console.log(`      ✅ Registrada - ID: ${response.data.measurementId}`)
      } else {
        console.log(`      ⚠️  ${response.data.status} - ${response.data.message}`)
      }
      
      // Esperar 2 segundos entre mediciones
      if (i < testMeasurements.length - 1) {
        console.log('      ⏳ Esperando 2 segundos...\n')
        await sleep(2000)
      }
    }
    
    console.log('\n🎉 Prueba completada!')
    console.log('💡 Verifica que las mediciones aparecieron en tiempo real en el frontend')
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.data)
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Ejecutar prueba
testRealtimeUpdates()
