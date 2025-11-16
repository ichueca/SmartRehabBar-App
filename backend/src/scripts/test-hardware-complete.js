#!/usr/bin/env node

import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

async function testHardwareIntegration() {
  console.log('🧪 Prueba completa de integración con hardware\n')
  
  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('🔍 Verificando servidor...')
    await axios.get(`${BASE_URL}/health`)
    console.log('✅ Servidor funcionando correctamente\n')
    
    // 2. Obtener lista de pacientes
    console.log('👥 Obteniendo pacientes...')
    const patientsResponse = await axios.get(`${BASE_URL}/api/patients`)
    const patients = patientsResponse.data
    
    if (patients.length === 0) {
      console.log('❌ No hay pacientes disponibles. Crea un paciente primero.')
      return
    }
    
    const patient = patients[0]
    console.log(`✅ Paciente seleccionado: ${patient.name}\n`)
    
    // 3. Verificar si hay sesión activa
    console.log('🔍 Verificando sesiones activas...')
    const activeSessionsResponse = await axios.get(`${BASE_URL}/api/sessions/active`)
    let activeSession = null
    
    if (activeSessionsResponse.data && activeSessionsResponse.data.length > 0) {
      activeSession = activeSessionsResponse.data[0]
      console.log(`✅ Sesión activa encontrada: ${activeSession.patient.name} (ID: ${activeSession.id})`)
    } else {
      // 4. Crear nueva sesión si no hay activa
      console.log('📝 Creando nueva sesión...')
      const sessionResponse = await axios.post(`${BASE_URL}/api/sessions`, {
        patientId: patient.id
      })
      activeSession = sessionResponse.data
      console.log(`✅ Sesión creada: ID ${activeSession.id}`)
    }
    
    console.log('')
    
    // 5. Limpiar cache de hardware
    console.log('🧹 Limpiando cache de hardware...')
    await axios.delete(`${BASE_URL}/api/hardware/cache`)
    console.log('✅ Cache limpiado\n')
    
    // 6. Enviar mediciones de prueba
    console.log('📊 Enviando mediciones de hardware...')
    
    const testMeasurements = [
      { foot: 'left', weight: 70.5 },
      { foot: 'right', weight: 68.2 },
      { foot: 'left', weight: 72.1 },
      { foot: 'right', weight: 69.8 },
      { foot: 'left', weight: 71.3 }
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
      
      // Esperar un poco entre mediciones para evitar filtros
      if (i < testMeasurements.length - 1) {
        await sleep(100)
      }
    }
    
    console.log('')
    
    // 7. Verificar estado del cache
    console.log('📋 Estado final del cache:')
    const cacheResponse = await axios.get(`${BASE_URL}/api/hardware/cache/status`)
    console.log(`   Entradas: ${cacheResponse.data.cacheSize}`)
    cacheResponse.data.entries.forEach(entry => {
      console.log(`   - ${entry.key}: ${entry.weight}kg (hace ${entry.ageMs}ms)`)
    })
    
    console.log('')
    
    // 8. Verificar mediciones en la sesión
    console.log('🔍 Verificando mediciones en la sesión...')
    const sessionResponse = await axios.get(`${BASE_URL}/api/sessions/${activeSession.id}`)
    const sessionData = sessionResponse.data
    
    console.log(`   Total mediciones: ${sessionData.measurements.length}`)
    sessionData.measurements.slice(0, 3).forEach((measurement, index) => {
      console.log(`   ${index + 1}. ${measurement.foot}: ${measurement.weight}kg - ${new Date(measurement.timestamp).toLocaleTimeString()}`)
    })
    
    console.log('')
    console.log('🎉 Prueba completada exitosamente!')
    console.log('')
    console.log('💡 Ahora puedes:')
    console.log('   1. Ir al frontend: http://localhost:3000')
    console.log('   2. Ver la sesión activa en el Dashboard')
    console.log('   3. Ejecutar el simulador: npm run simulate:normal')
    console.log('   4. Observar las actualizaciones en tiempo real')
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.data)
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en http://localhost:5000')
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Ejecutar prueba
testHardwareIntegration()
