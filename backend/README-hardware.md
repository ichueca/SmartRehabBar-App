# 🔧 Hardware Integration - SmartRehabBar

## 🚀 Inicio Rápido

### 1. Iniciar el Backend
```bash
cd backend
npm run dev
```

### 2. Iniciar una Sesión
- Ve al frontend: http://localhost:3000
- Selecciona un paciente
- Haz clic en "Iniciar Sesión de Prueba"

### 3. Probar con Simulador
```bash
# Terminal separado
cd backend
npm run simulate:normal
```

## 📋 Comandos Disponibles

### Simulador de Hardware
```bash
# Patrones predefinidos
npm run simulate              # Patrón normal, duración infinita
npm run simulate:normal       # Patrón equilibrado
npm run simulate:unbalanced   # Desequilibrio moderado  
npm run simulate:limping      # Patrón de cojera

# Configuración personalizada
node src/scripts/simulate-hardware.js \
  --frequency 20 \
  --pattern normal \
  --duration 30 \
  --left-weight 75 \
  --right-weight 70
```

### Pruebas y Debugging
```bash
# Probar filtros (requiere sesión activa)
node src/scripts/test-filters.js

# Ver estado del cache
curl http://localhost:5000/api/hardware/cache/status

# Limpiar cache
curl -X DELETE http://localhost:5000/api/hardware/cache

# Envío manual de medición
curl "http://localhost:5000/api/hardware/left?peso=70.5"
```

## 🎮 Controles del Simulador

Durante la simulación, puedes usar estas teclas:
- **n**: Cambiar a patrón normal
- **u**: Cambiar a patrón desequilibrado  
- **l**: Cambiar a patrón cojera
- **s**: Mostrar estado actual
- **h**: Mostrar ayuda
- **Ctrl+C**: Detener simulación

## 📊 Respuestas de la API

### ✅ Medición Registrada
```json
{
  "status": "ok",
  "message": "Medición registrada correctamente",
  "sessionId": 123,
  "measurementId": 456,
  "patientName": "Juan Pérez"
}
```

### ⚠️ Sin Sesión Activa
```json
{
  "status": "no_active_session",
  "message": "No hay sesión activa para registrar mediciones"
}
```

### 🚫 Filtros Aplicados
```json
{
  "status": "filtered_time",
  "message": "Medición filtrada por frecuencia (< 50ms)"
}
```

```json
{
  "status": "filtered_weight", 
  "message": "Medición filtrada por cambio mínimo (< 1kg)"
}
```

## 🔧 Configuración de Filtros

### Filtro Temporal
- **Mínimo**: 50ms entre mediciones del mismo pie
- **Propósito**: Evitar saturación de BD
- **Configurable en**: `backend/src/routes/hardware.js` línea 58

### Filtro de Cambio
- **Mínimo**: 1kg de diferencia
- **Propósito**: Filtrar micro-variaciones
- **Configurable en**: `backend/src/routes/hardware.js` línea 65

## 🐛 Solución de Problemas

### "No hay sesión activa"
1. Ve al frontend (http://localhost:3000)
2. Selecciona un paciente
3. Inicia una sesión de prueba

### "Error HTTP: ECONNREFUSED"
1. Verifica que el backend esté ejecutándose
2. Confirma la URL: http://localhost:5000
3. Revisa que no haya conflictos de puerto

### "Mediciones no aparecen en frontend"
1. Verifica que Socket.IO esté funcionando
2. Revisa la consola del navegador
3. Confirma que estás en la vista de sesión activa

### Cache lleno o comportamiento extraño
```bash
curl -X DELETE http://localhost:5000/api/hardware/cache
```

## 📈 Métricas de Rendimiento

### Frecuencias Recomendadas
- **Desarrollo**: 5-10 Hz
- **Pruebas**: 10-15 Hz  
- **Producción**: 15-20 Hz
- **Máximo**: 25 Hz

### Mediciones por Pisada
- **Pisada típica**: 0.8-1.5 segundos
- **A 15 Hz**: 12-22 mediciones por pisada
- **A 20 Hz**: 16-30 mediciones por pisada

## 🔗 Endpoints de la API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/hardware/left?peso=X` | GET | Enviar medición pie izquierdo |
| `/api/hardware/right?peso=X` | GET | Enviar medición pie derecho |
| `/api/hardware/cache/status` | GET | Ver estado del cache |
| `/api/hardware/cache` | DELETE | Limpiar cache |

## 📚 Documentación Adicional

- **Integración Hardware**: `backend/docs/hardware-integration.md`
- **Código ESP32**: Ver ejemplos en documentación
- **API Reference**: Endpoints completos con ejemplos
