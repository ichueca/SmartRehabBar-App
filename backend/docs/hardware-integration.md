# 📡 Integración con Hardware - SmartRehabBar

## 🎯 Resumen

Este documento describe cómo integrar sensores de peso con la aplicación SmartRehabBar. Los sensores envían mediciones HTTP a endpoints específicos que procesan y almacenan los datos en tiempo real.

## 🔌 Arquitectura del Sistema

```
Sensor Pie Izq (ESP32) ──┐
                         ├─► WiFi ──► SmartRehabBar API ──► Frontend
Sensor Pie Der (ESP32) ──┘
```

## 📋 Endpoints de la API

### **Envío de Mediciones**

**URL**: `GET /api/hardware/{foot}?peso={weight}`

**Parámetros**:
- `{foot}`: `left` | `right` - Identificador del pie
- `{weight}`: `number` - Peso medido en kilogramos (ej: 70.5)

**Ejemplos**:
```
http://192.168.1.100:5000/api/hardware/left?peso=70.5
http://192.168.1.100:5000/api/hardware/right?peso=68.2
```

### **Respuestas de la API**

#### ✅ **Medición Registrada**
```json
{
  "status": "ok",
  "message": "Medición registrada correctamente",
  "sessionId": 123,
  "measurementId": 456,
  "patientName": "Juan Pérez"
}
```

#### ⚠️ **No Hay Sesión Activa**
```json
{
  "status": "no_active_session",
  "message": "No hay sesión activa para registrar mediciones"
}
```

#### 🚫 **Medición Filtrada**
```json
{
  "status": "filtered_time",
  "message": "Medición filtrada por frecuencia (< 50ms)",
  "sessionId": 123
}
```

```json
{
  "status": "filtered_weight", 
  "message": "Medición filtrada por cambio mínimo (< 1kg)",
  "sessionId": 123
}
```

#### ❌ **Error de Parámetros**
```json
{
  "error": "Invalid foot parameter",
  "message": "foot must be \"left\" or \"right\""
}
```

## ⚙️ Filtros Implementados

### **Filtro Temporal**
- **Mínimo**: 50ms entre mediciones del mismo pie
- **Propósito**: Evitar saturación de la base de datos
- **Comportamiento**: Mediciones muy frecuentes son descartadas

### **Filtro de Cambio**
- **Mínimo**: 1kg de diferencia con la medición anterior
- **Propósito**: Filtrar ruido y micro-variaciones
- **Comportamiento**: Cambios pequeños son ignorados

## 🔧 Código de Ejemplo para ESP32/Arduino

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Configuración
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* serverURL = "http://192.168.1.100:5000";

// Pines de sensores
const int SENSOR_LEFT_PIN = A0;
const int SENSOR_RIGHT_PIN = A1;

// Umbrales
const float WEIGHT_THRESHOLD = 5.0; // kg mínimo para enviar
const unsigned long SEND_INTERVAL = 100; // ms entre envíos

unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  Serial.println("WiFi conectado!");
}

void loop() {
  unsigned long now = millis();
  
  // Leer sensores
  float leftWeight = readSensor(SENSOR_LEFT_PIN);
  float rightWeight = readSensor(SENSOR_RIGHT_PIN);
  
  // Enviar si supera umbral y ha pasado tiempo mínimo
  if (now - lastSendTime > SEND_INTERVAL) {
    if (leftWeight > WEIGHT_THRESHOLD) {
      sendMeasurement("left", leftWeight);
    }
    if (rightWeight > WEIGHT_THRESHOLD) {
      sendMeasurement("right", rightWeight);
    }
    lastSendTime = now;
  }
  
  delay(10); // Leer cada 10ms
}

float readSensor(int pin) {
  // Implementar lectura del sensor de peso
  // Convertir valor analógico a kg
  int rawValue = analogRead(pin);
  return (rawValue / 1023.0) * 100.0; // Ejemplo de conversión
}

void sendMeasurement(String foot, float weight) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverURL) + "/api/hardware/" + foot + "?peso=" + String(weight, 2);
    
    http.begin(url);
    int httpCode = http.GET();
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Enviado " + foot + ": " + String(weight) + "kg - " + response);
    } else {
      Serial.println("Error HTTP: " + String(httpCode));
    }
    
    http.end();
  }
}
```

## 🧪 Simulador para Pruebas

Para probar la integración sin hardware real, usa el simulador incluido:

```bash
# Simulación básica
npm run simulate

# Patrones específicos
npm run simulate:normal      # Patrón equilibrado
npm run simulate:unbalanced  # Desequilibrio moderado
npm run simulate:limping     # Patrón de cojera

# Configuración personalizada
node src/scripts/simulate-hardware.js \
  --url http://localhost:5000 \
  --frequency 20 \
  --pattern normal \
  --duration 30
```

## 📊 Frecuencias Recomendadas

| Escenario | Frecuencia | Mediciones/Pisada | Uso |
|-----------|------------|-------------------|-----|
| **Básico** | 10 Hz | 8-15 | Pruebas iniciales |
| **Óptimo** | 15 Hz | 12-22 | Uso normal |
| **Detallado** | 20 Hz | 16-30 | Análisis médico |
| **Máximo** | 25 Hz | 20-37 | Investigación |

## 🔍 Debugging y Monitoreo

### **Ver Estado del Cache**
```bash
curl http://localhost:5000/api/hardware/cache/status
```

### **Limpiar Cache**
```bash
curl -X DELETE http://localhost:5000/api/hardware/cache
```

### **Logs del Servidor**
El servidor muestra logs detallados de todas las mediciones recibidas.

## 🚨 Consideraciones Importantes

1. **Sesión Activa**: Solo se registran mediciones cuando hay una sesión activa
2. **Filtros**: Las mediciones pueden ser filtradas por frecuencia o cambio mínimo
3. **Red**: Asegurar conectividad WiFi estable entre sensores y servidor
4. **Sincronización**: Los sensores no necesitan sincronización entre ellos
5. **Tolerancia a Fallos**: El sistema continúa funcionando aunque fallen algunos envíos

## 📞 Soporte

Para dudas técnicas o problemas de integración, contactar al equipo de desarrollo con:
- Logs del servidor
- Código del microcontrolador
- Descripción del problema observado
