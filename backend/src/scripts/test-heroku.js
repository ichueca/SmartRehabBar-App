#!/usr/bin/env node

/**
 * Script para probar la conectividad con Heroku
 * Verifica que el servidor esté funcionando y puede recibir mediciones
 */

import fetch from 'node-fetch'

const HEROKU_URL = process.env.HEROKU_URL || 'https://smartrehabbar.herokuapp.com'

console.log('🧪 Probando conectividad con Heroku')
console.log(`📡 URL: ${HEROKU_URL}`)

async function testHerokuConnection() {
  try {
    // 1. Probar endpoint de salud
    console.log('\n🔍 1. Probando endpoint de salud...')
    const healthResponse = await fetch(`${HEROKU_URL}/api/health`)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Servidor funcionando:', healthData)
    } else {
      console.log('❌ Servidor no responde:', healthResponse.status)
      return false
    }

    // 2. Probar endpoint de pacientes
    console.log('\n👥 2. Probando endpoint de pacientes...')
    const patientsResponse = await fetch(`${HEROKU_URL}/api/patients`)
    
    if (patientsResponse.ok) {
      const patients = await patientsResponse.json()
      console.log(`✅ ${patients.length} pacientes encontrados`)
    } else {
      console.log('❌ Error obteniendo pacientes:', patientsResponse.status)
    }

    // 3. Probar endpoint de sesiones activas
    console.log('\n📋 3. Probando sesiones activas...')
    const sessionsResponse = await fetch(`${HEROKU_URL}/api/sessions/active`)
    
    if (sessionsResponse.ok) {
      const activeSessions = await sessionsResponse.json()
      console.log(`✅ ${activeSessions.length} sesiones activas`)
      
      if (activeSessions.length > 0) {
        console.log('📊 Sesión activa encontrada:', {
          id: activeSessions[0].id,
          patient: activeSessions[0].patient?.name,
          startTime: activeSessions[0].startTime
        })
      }
    } else {
      console.log('❌ Error obteniendo sesiones:', sessionsResponse.status)
    }

    // 4. Probar envío de medición de prueba (solo si hay sesión activa)
    const activeSessions = await fetch(`${HEROKU_URL}/api/sessions/active`).then(r => r.json())
    
    if (activeSessions.length > 0) {
      console.log('\n🎯 4. Probando envío de medición...')
      const testWeight = 75.5
      const measurementResponse = await fetch(`${HEROKU_URL}/api/hardware/left?peso=${testWeight}`)
      
      if (measurementResponse.ok) {
        const result = await measurementResponse.json()
        console.log('✅ Medición enviada correctamente:', result)
      } else {
        console.log('❌ Error enviando medición:', measurementResponse.status)
      }
    } else {
      console.log('\n⚠️  4. No hay sesión activa, saltando prueba de medición')
      console.log('💡 Crea una sesión desde el frontend para probar mediciones')
    }

    console.log('\n🎉 Prueba de conectividad completada')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Si todo está ✅, puedes usar el simulador:')
    console.log(`   npm run simulate:heroku:normal`)
    console.log('2. O configurar el hardware real con la URL:')
    console.log(`   ${HEROKU_URL}`)

    return true

  } catch (error) {
    console.error('❌ Error de conectividad:', error.message)
    console.log('\n🔧 Posibles soluciones:')
    console.log('1. Verificar que la app esté desplegada en Heroku')
    console.log('2. Verificar la URL en HEROKU_URL')
    console.log('3. Verificar conexión a internet')
    return false
  }
}

// Ejecutar prueba
testHerokuConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Error inesperado:', error)
    process.exit(1)
  })
