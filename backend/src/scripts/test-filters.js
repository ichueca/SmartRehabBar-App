#!/usr/bin/env node

import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

async function testFilters() {
  console.log('🧪 Probando filtros del endpoint de hardware\n')
  
  try {
    // Limpiar cache
    console.log('🧹 Limpiando cache...')
    await axios.delete(`${BASE_URL}/api/hardware/cache`)
    
    // Verificar que hay sesión activa
    console.log('🔍 Verificando sesión activa...')
    const sessionCheck = await axios.get(`${BASE_URL}/api/sessions/active`)
    
    if (!sessionCheck.data || sessionCheck.data.length === 0) {
      console.log('❌ No hay sesión activa. Inicia una sesión en el frontend primero.')
      return
    }
    
    const activeSession = sessionCheck.data[0]
    console.log(`✅ Sesión activa encontrada: ${activeSession.patient.name}\n`)
    
    // Test 1: Medición normal
    console.log('📊 Test 1: Medición normal')
    const response1 = await axios.get(`${BASE_URL}/api/hardware/left?peso=70.5`)
    console.log(`   Resultado: ${response1.data.status} - ${response1.data.message}`)
    
    // Test 2: Filtro temporal (< 50ms)
    console.log('\n⏱️  Test 2: Filtro temporal (inmediato)')
    const response2 = await axios.get(`${BASE_URL}/api/hardware/left?peso=71.0`)
    console.log(`   Resultado: ${response2.data.status} - ${response2.data.message}`)
    
    // Test 3: Esperar y enviar cambio pequeño (< 1kg)
    console.log('\n⚖️  Test 3: Filtro de cambio mínimo (< 1kg)')
    await sleep(100) // Esperar para pasar filtro temporal
    const response3 = await axios.get(`${BASE_URL}/api/hardware/left?peso=70.8`)
    console.log(`   Resultado: ${response3.data.status} - ${response3.data.message}`)
    
    // Test 4: Cambio significativo (> 1kg)
    console.log('\n✅ Test 4: Cambio significativo (> 1kg)')
    await sleep(100)
    const response4 = await axios.get(`${BASE_URL}/api/hardware/left?peso=72.0`)
    console.log(`   Resultado: ${response4.data.status} - ${response4.data.message}`)
    
    // Test 5: Pie diferente (no debería filtrar)
    console.log('\n👣 Test 5: Pie diferente (right)')
    const response5 = await axios.get(`${BASE_URL}/api/hardware/right?peso=68.5`)
    console.log(`   Resultado: ${response5.data.status} - ${response5.data.message}`)
    
    // Test 6: Parámetros inválidos
    console.log('\n❌ Test 6: Parámetros inválidos')
    try {
      const response6 = await axios.get(`${BASE_URL}/api/hardware/invalid?peso=70.0`)
      console.log(`   Resultado: ${response6.data.error}`)
    } catch (error) {
      if (error.response) {
        console.log(`   Resultado: ${error.response.data.error} - ${error.response.data.message}`)
      }
    }
    
    // Mostrar estado final del cache
    console.log('\n📋 Estado final del cache:')
    const cacheStatus = await axios.get(`${BASE_URL}/api/hardware/cache/status`)
    console.log(`   Entradas en cache: ${cacheStatus.data.cacheSize}`)
    cacheStatus.data.entries.forEach(entry => {
      console.log(`   - ${entry.key}: ${entry.weight}kg (hace ${entry.ageMs}ms)`)
    })
    
    console.log('\n🎉 Pruebas completadas!')
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en http://localhost:5000')
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Ejecutar pruebas
testFilters()
