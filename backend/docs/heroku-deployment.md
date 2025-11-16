# 🚀 Despliegue en Heroku - SmartRehabBar

## 📋 Preparación para Heroku

### 1. Configuración de Puertos
- ✅ Backend ya configurado: `process.env.PORT || 5000`
- ✅ Frontend usa rutas relativas: `/api`
- ✅ Socket.IO detecta automáticamente el entorno

### 2. Variables de Entorno Necesarias

```bash
# Base de datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui

# CORS
FRONTEND_URL=https://tu-app.herokuapp.com

# Opcional: Para debugging
NODE_ENV=production
```

### 3. Archivos de Configuración

#### `backend/package.json` - Scripts
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "echo 'No build needed for backend'",
    "heroku-postbuild": "npm run migrate"
  }
}
```

#### `Procfile` (en la raíz del proyecto)
```
web: cd backend && npm start
```

## ⚠️ Limitaciones de Heroku (Plan Gratuito)

### Límites Críticos
- **Requests/hora**: ~2,400
- **Conexiones simultáneas**: 20
- **Memoria**: 512MB
- **Sleep después de 30min inactividad**

### Impacto en SmartRehabBar
```
Simulador actual: 10 Hz × 30s = 300 requests
1 hora continua: 36,000 requests ❌ EXCEDE LÍMITE
```

## 🛠️ Soluciones Recomendadas

### Opción 1: Reducir Frecuencia para Heroku
```javascript
// En producción: máximo 1 Hz
const isProduction = process.env.NODE_ENV === 'production'
const MAX_FREQUENCY = isProduction ? 1 : 20 // Hz
```

### Opción 2: Batching de Mediciones
```javascript
// Enviar 10 mediciones en una sola request
POST /api/hardware/batch
{
  "measurements": [
    {"foot": "left", "weight": 70.5, "timestamp": "..."},
    {"foot": "right", "weight": 68.2, "timestamp": "..."},
    // ... hasta 10 mediciones
  ]
}
```

### Opción 3: Plan Pagado ($7/mes)
- Sin límite de requests
- Sin sleep automático
- Mejor rendimiento

## 🔧 Configuración de Hardware Real

### Para ESP32/Arduino conectando a Heroku:
```cpp
// URL de producción
const char* serverURL = "https://tu-app.herokuapp.com";

// Enviar medición
void sendMeasurement(String foot, float weight) {
  HTTPClient http;
  http.begin(serverURL + "/api/hardware/" + foot + "?peso=" + String(weight));
  int httpCode = http.GET();
  http.end();
}
```

### Consideraciones de Red
- **HTTPS obligatorio** en Heroku
- **Certificados SSL** automáticos
- **Latencia**: ~100-300ms (vs ~5ms local)

## 📊 Monitoreo y Alertas

### Métricas a Vigilar
- Requests por hora
- Tiempo de respuesta
- Errores de conexión
- Uso de memoria

### Herramientas
- Heroku Metrics (básico)
- New Relic (avanzado)
- Logs: `heroku logs --tail`

## 🚨 Detección de "Ataques"

### Heroku NO considera ataques:
- ✅ Requests regulares de hardware
- ✅ WebSocket connections
- ✅ Frecuencias médicas normales (1-5 Hz)

### SÍ puede ser problemático:
- ❌ >100 requests/segundo
- ❌ Miles de conexiones simultáneas
- ❌ Patrones irregulares/maliciosos

### Protección Recomendada
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit')

const hardwareLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto por IP
  message: 'Demasiadas mediciones, intenta más tarde'
})

app.use('/api/hardware', hardwareLimit)
```

## 🎯 Recomendación Final

### Para Demo/Pruebas:
1. **Usar Heroku gratuito** con frecuencia reducida (1 Hz)
2. **Implementar batching** para eficiencia
3. **Monitorear límites** activamente

### Para Producción Real:
1. **Plan Hobby de Heroku** ($7/mes) mínimo
2. **O mejor: VPS dedicado** (DigitalOcean, AWS)
3. **Raspberry Pi local** para instalaciones físicas

¿Quieres que implementemos alguna de estas soluciones antes del despliegue?
