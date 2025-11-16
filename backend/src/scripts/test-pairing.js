#!/usr/bin/env node

import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

async function testPairing() {
  console.log('🔗 Prueba de emparejamiento automático\n')
  
  try {
    // 1. Verificar sesión activa
    console.log('🔍 Verificando sesión activa...')
    const activeSessionsResponse = await axios.get(`${BASE_URL}/api/sessions/active`)
    
    if (!activeSessionsResponse.data || activeSessionsResponse.data.length === 0) {
      console.log('❌ No hay sesión activa.')
      return
    }
    
    const activeSession = activeSessionsResponse.data[0]
    console.log(`✅ Sesión activa: ${activeSession.patient.name} (ID: ${activeSession.id})\n`)
    
    // 2. Limpiar cache
    await axios.delete(`${BASE_URL}/api/hardware/cache`)
    
    // 3. Enviar pares de mediciones para probar emparejamiento
    console.log('📊 Enviando pares de mediciones para emparejamiento...\n')
    
    const testPairs = [
      { left: 75.0, right: 73.0 },
      { left: 76.2, right: 74.1 },
      { left: 74.8, right: 72.9 },
      { left: 77.5, right: 75.2 }
    ]
    
    for (let i = 0; i < testPairs.length; i++) {
      const { left, right } = testPairs[i]
      
      console.log(`🦶 Par ${i + 1}:`)
      
      // Enviar pie izquierdo
      console.log(`   Enviando left: ${left}kg`)
      const leftResponse = await axios.get(`${BASE_URL}/api/hardware/left?peso=${left}`)
      console.log(`   ✅ Left registrado - ID: ${leftResponse.data.measurementId}`)
      
      // Esperar un poco
      await sleep(200)
      
      // Enviar pie derecho
      console.log(`   Enviando right: ${right}kg`)
      const rightResponse = await axios.get(`${BASE_URL}/api/hardware/right?peso=${right}`)
      console.log(`   ✅ Right registrado - ID: ${rightResponse.data.measurementId}`)
      
      console.log(`   💡 Debería haberse creado una pisada emparejada\n`)
      
      // Esperar antes del siguiente par
      if (i < testPairs.length - 1) {
        await sleep(1000)
      }
    }
    
    // 4. Verificar resultados
    console.log('🔍 Verificando resultados en la sesión...')
    const sessionResponse = await axios.get(`${BASE_URL}/api/sessions/${activeSession.id}`)
    const sessionData = sessionResponse.data
    
    console.log(`📊 Estadísticas:`)
    console.log(`   Total mediciones: ${sessionData.measurements.length}`)
    
    // Contar emparejadas vs individuales
    const pairedCount = sessionData.measurements.filter(m => m.pairedMeasurementId).length
    const unpairedCount = sessionData.measurements.filter(m => !m.pairedMeasurementId).length
    
    console.log(`   Mediciones emparejadas: ${pairedCount}`)
    console.log(`   Mediciones individuales: ${unpairedCount}`)
    console.log(`   Pisadas completas: ${pairedCount / 2}`)
    
    console.log('\n🎉 Prueba de emparejamiento completada!')
    console.log('💡 Ve al frontend para verificar que aparecen gráficos y colores de balance')
    
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
testPairing()
