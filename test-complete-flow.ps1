# Script de prueba completo para SmartRehabBar
# Este script prueba todo el flujo: crear paciente, iniciar sesión, enviar mediciones

Write-Host "🏥 SmartRehabBar - Script de Prueba Completo" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Crear paciente
Write-Host "1. Creando paciente..." -ForegroundColor Yellow
try {
    $patient = Invoke-RestMethod -Uri "http://localhost:5000/api/patients" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Juan Pérez","dateOfBirth":"1980-05-15","diagnosis":"Rehabilitación post-operatoria","notes":"Paciente de prueba"}'
    Write-Host "   ✅ Paciente creado: $($patient.name) (ID: $($patient.id))" -ForegroundColor Green
    $patientId = $patient.id
} catch {
    Write-Host "   ❌ Error al crear paciente: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# 2. Iniciar sesión
Write-Host "`n2. Iniciando sesión de rehabilitación..." -ForegroundColor Yellow
try {
    $session = Invoke-RestMethod -Uri "http://localhost:5000/api/sessions" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"patientId`":$patientId}"
    Write-Host "   ✅ Sesión iniciada (ID: $($session.id))" -ForegroundColor Green
    $sessionId = $session.id
} catch {
    Write-Host "   ❌ Error al iniciar sesión: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# 3. Enviar 10 pares de mediciones
Write-Host "`n3. Enviando 10 pares de mediciones..." -ForegroundColor Yellow
Write-Host "   (Observa la página web para ver las actualizaciones en tiempo real)" -ForegroundColor Gray

for ($i = 1; $i -le 10; $i++) {
    # Generar pesos aleatorios realistas
    $leftWeight = Get-Random -Minimum 60 -Maximum 75
    $rightWeight = Get-Random -Minimum 60 -Maximum 75
    $duration = Get-Random -Minimum 700 -Maximum 1000
    
    # Timestamp actual
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    # Enviar medición izquierda
    $left = Invoke-RestMethod -Uri "http://localhost:5000/api/measurements/left" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"sessionId`":$sessionId,`"weight`":$leftWeight,`"duration`":$duration,`"timestamp`":`"$timestamp`"}"
    
    # Pequeña pausa para simular tiempo real
    Start-Sleep -Milliseconds 200
    
    # Timestamp para medición derecha
    $timestampRight = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    # Enviar medición derecha
    $right = Invoke-RestMethod -Uri "http://localhost:5000/api/measurements/right" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"sessionId`":$sessionId,`"weight`":$rightWeight,`"duration`":$duration,`"timestamp`":`"$timestampRight`"}"
    
    if ($right.paired) {
        $balance = $right.balance
        Write-Host "   ✅ Pisada $i - Izq: ${leftWeight}kg | Der: ${rightWeight}kg | Balance: $($balance.leftPercentage)% / $($balance.rightPercentage)%" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Pisada $i - No emparejada" -ForegroundColor Yellow
    }
    
    # Pausa entre pisadas
    Start-Sleep -Seconds 1
}

Start-Sleep -Seconds 2

# 4. Obtener estadísticas de la sesión
Write-Host "`n4. Obteniendo estadísticas de la sesión..." -ForegroundColor Yellow
try {
    $sessionData = Invoke-RestMethod -Uri "http://localhost:5000/api/sessions/$sessionId" -Method GET
    $stats = $sessionData.statistics
    
    Write-Host "   📊 Estadísticas:" -ForegroundColor Cyan
    Write-Host "      - Total de mediciones: $($sessionData.measurements.Count)" -ForegroundColor White
    Write-Host "      - Total de pisadas: $($stats.totalSteps)" -ForegroundColor White
    
    if ($stats.averageBalance) {
        Write-Host "      - Balance promedio: $($stats.averageBalance.leftPercentage)% / $($stats.averageBalance.rightPercentage)%" -ForegroundColor White
        Write-Host "      - Peso promedio izq: $($stats.averageBalance.leftWeight.ToString('F1'))kg" -ForegroundColor White
        Write-Host "      - Peso promedio der: $($stats.averageBalance.rightWeight.ToString('F1'))kg" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Error al obtener estadísticas: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 5. Finalizar sesión
Write-Host "`n5. Finalizando sesión..." -ForegroundColor Yellow
try {
    $endedSession = Invoke-RestMethod -Uri "http://localhost:5000/api/sessions/$sessionId" -Method PATCH -Headers @{"Content-Type"="application/json"} -Body '{"notes":"Sesión de prueba completada exitosamente"}'
    Write-Host "   ✅ Sesión finalizada" -ForegroundColor Green
    
    if ($endedSession.statistics) {
        $finalStats = $endedSession.statistics
        Write-Host "`n   📈 Estadísticas Finales:" -ForegroundColor Cyan
        Write-Host "      - Duración: $([math]::Round(((Get-Date $endedSession.endTime) - (Get-Date $endedSession.startTime)).TotalMinutes, 1)) minutos" -ForegroundColor White
        Write-Host "      - Total pisadas: $($finalStats.totalSteps)" -ForegroundColor White
        
        if ($finalStats.averageBalance) {
            Write-Host "      - Balance final: $($finalStats.averageBalance.leftPercentage)% / $($finalStats.averageBalance.rightPercentage)%" -ForegroundColor White
            Write-Host "      - Diferencia: $($finalStats.averageBalance.difference)%" -ForegroundColor White
            Write-Host "      - Estado: $($finalStats.averageBalance.status)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ❌ Error al finalizar sesión: $_" -ForegroundColor Red
}

# Resumen
Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "✅ Prueba completada exitosamente!" -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   - Paciente creado: $($patient.name) (ID: $patientId)" -ForegroundColor White
Write-Host "   - Sesión ID: $sessionId" -ForegroundColor White
Write-Host "   - Mediciones enviadas: 20 (10 pares)" -ForegroundColor White
Write-Host "" -ForegroundColor Cyan
Write-Host "🌐 Revisa la aplicación web en:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "💡 Puedes ver:" -ForegroundColor Yellow
Write-Host "   - Dashboard con estadísticas" -ForegroundColor White
Write-Host "   - Detalle del paciente en /patients/$patientId" -ForegroundColor White
Write-Host "   - Detalle de la sesión en /sessions/$sessionId" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

