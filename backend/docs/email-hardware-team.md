# Correo para el Equipo de Hardware - SmartRehabBar

**Asunto:** 🚀 SmartRehabBar: Instrucciones para Pruebas con Hardware Real (ESP32)

---

## Estimado Equipo de Hardware,

¡Excelentes noticias! El sistema **SmartRehabBar** ya está completamente desplegado y funcionando en Heroku. Es momento de realizar las pruebas de integración con el hardware real.

### 📋 **Información del Sistema Desplegado**

- **URL de la aplicación**: https://smartrehabbar-demo-7f620514b4ed.herokuapp.com/
- **Endpoints para sensores**: 
  - Pie izquierdo: `https://smartrehabbar-demo-7f620514b4ed.herokuapp.com/api/hardware/left?peso=XX.X`
  - Pie derecho: `https://smartrehabbar-demo-7f620514b4ed.herokuapp.com/api/hardware/right?peso=XX.X`

### 🔧 **Código Adaptado para ESP32**

Basándome en el código que utilizasteis anteriormente, aquí está la adaptación para SmartRehabBar:

**📝 Nota importante**: El código tiene **placeholders** que debéis completar:
- **`setup()`**: Ya incluye inicialización WiFi, pero podéis añadir inicialización de sensores
- **`leerSensorIzquierdo()`** y **`leerSensorDerecho()`**: Debéis implementar estas funciones según vuestro hardware específico
- **`loop()`**: Ya está completo, solo llama a vuestras funciones de lectura

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Configuración WiFi
const char* ssid = "VUESTRO_WIFI";
const char* password = "VUESTRA_PASSWORD";

// Configuración del servidor
const char* serverURL = "https://smartrehabbar-demo-7f620514b4ed.herokuapp.com";

// Variables para control de frecuencia
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 100; // Mínimo 100ms entre envíos (10 Hz máximo)

// Variables para filtro de cambio mínimo
float lastWeightLeft = -1;
float lastWeightRight = -1;
const float MIN_WEIGHT_CHANGE = 0.5; // Mínimo 0.5kg de cambio para enviar

void setup() {
  Serial.begin(115200);
  
  // Conectar a WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi conectado!");
  Serial.print("📡 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("🌐 Servidor: ");
  Serial.println(serverURL);
}

void sendMeasurement(String foot, float weight) {
  // Control de frecuencia: máximo 10 Hz
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime < SEND_INTERVAL) {
    return; // Saltar envío si es muy frecuente
  }
  
  // Filtro de cambio mínimo
  float* lastWeight = (foot == "left") ? &lastWeightLeft : &lastWeightRight;
  if (*lastWeight != -1 && abs(weight - *lastWeight) < MIN_WEIGHT_CHANGE) {
    return; // Saltar envío si el cambio es muy pequeño
  }
  
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado");
    return;
  }
  
  // Enviar medición
  HTTPClient http;
  String url = String(serverURL) + "/api/hardware/" + foot + "?peso=" + String(weight, 1);
  
  http.begin(url);
  http.setTimeout(5000); // Timeout de 5 segundos
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ " + foot + ": " + String(weight, 1) + "kg → Enviado OK");
    
    // Actualizar último peso enviado
    *lastWeight = weight;
    lastSendTime = currentTime;
    
  } else if (httpCode == 429) {
    Serial.println("⚠️ " + foot + ": Filtrado por servidor (muy frecuente)");
  } else {
    Serial.println("❌ " + foot + ": Error " + String(httpCode));
  }
  
  http.end();
}

void loop() {
  // Leer sensores usando vuestras funciones implementadas
  float pesoIzquierdo = leerSensorIzquierdo();  // Implementar esta función
  float pesoDerecho = leerSensorDerecho();      // Implementar esta función
  
  // Enviar mediciones (con filtros automáticos)
  if (pesoIzquierdo > 5.0) {  // Solo enviar si hay peso significativo
    sendMeasurement("left", pesoIzquierdo);
  }
  
  if (pesoDerecho > 5.0) {    // Solo enviar si hay peso significativo
    sendMeasurement("right", pesoDerecho);
  }
  
  delay(50); // Lectura cada 50ms (20 Hz de lectura, pero envío filtrado a 10 Hz)
}

// Funciones que debéis implementar según vuestros sensores
float leerSensorIzquierdo() {
  // IMPLEMENTAR: Lectura del sensor del pie izquierdo
  // Ejemplo con HX711: return scale_left.get_units(1);
  // Ejemplo con ADC: return convertirADCaPeso(analogRead(PIN_LEFT));
  return 0.0; // PLACEHOLDER - reemplazar con código real
}

float leerSensorDerecho() {
  // IMPLEMENTAR: Lectura del sensor del pie derecho
  // Ejemplo con HX711: return scale_right.get_units(1);
  // Ejemplo con ADC: return convertirADCaPeso(analogRead(PIN_RIGHT));
  return 0.0; // PLACEHOLDER - reemplazar con código real
}
```

### ⚠️ **IMPORTANTE: Control de Frecuencia de Envío**

**Problema identificado**: Si enviáis todas las mediciones según las recibís de los sensores (por ejemplo, a 50-100 Hz), podríais saturar el servidor y la red, causando:
- Pérdida de mediciones importantes
- Latencia excesiva
- Posible bloqueo por parte de Heroku
- Consumo excesivo de batería del ESP32

**Solución implementada**: El código ESP32 incluye **dos filtros automáticos**:

1. **Filtro Temporal**: Máximo 10 Hz (100ms entre envíos)
2. **Filtro de Cambio**: Solo envía si el peso cambia ≥0.5kg

**Filtros adicionales en el servidor backend**:
- Filtro temporal: Mínimo 50ms entre mediciones del mismo pie
- Filtro de cambio: Mínimo 1kg de diferencia

**Procesamiento automático en el servidor**:
- Ventana de emparejamiento: 2 segundos para emparejar mediciones de ambos pies
- Cálculo automático de balance y métricas
- Actualización en tiempo real vía Socket.IO

### � **División de Responsabilidades**

| **ESP32 (Hardware)** | **Servidor Backend** |
|----------------------|---------------------|
| ✅ Leer sensores de peso | ✅ Recibir mediciones HTTP |
| ✅ Filtrar frecuencia (10 Hz máx) | ✅ Filtros adicionales (50ms, 1kg) |
| ✅ Filtrar cambios mínimos (0.5kg) | ✅ Emparejar pies automáticamente |
| ✅ Enviar HTTP GET | ✅ Calcular balance y métricas |
| ✅ Manejar reconexión WiFi | ✅ Actualizar frontend en tiempo real |

**👥 Vosotros solo necesitáis**: Leer sensores y enviar mediciones. **El servidor se encarga del resto**.

### �📋 **Pasos para las Pruebas**

#### **Paso 1: Preparar el Sistema**
1. Abrir la aplicación: https://smartrehabbar-demo-7f620514b4ed.herokuapp.com/
2. **Elegir tipo de medición:**
   - **🚶 "Iniciar Medición Pisadas"** → Para medir caminar/pasos
   - **🪑 "Iniciar Medición Levantarse"** → Para medir sit-to-stand (levantarse)
3. Seleccionar un paciente de prueba
4. **¡IMPORTANTE!** Dejar la ventana abierta para ver las mediciones en tiempo real

> **Nota**: Solo puede haber una medición activa a la vez (las dos plataformas se comparten)

#### **Paso 2: Configurar el ESP32**
1. Actualizar las credenciales WiFi en el código
2. Implementar las funciones `leerSensorIzquierdo()` y `leerSensorDerecho()`
3. Subir el código al ESP32
4. Abrir el monitor serie para ver los logs

#### **Paso 3: Realizar Pruebas**

**🚶 Pruebas de Medición Pisadas:**
1. **Prueba básica**: Colocar peso en un sensor y verificar que aparece en la aplicación
2. **Prueba de emparejamiento**: Colocar peso en ambos sensores simultáneamente
3. **Prueba de patrones**: Simular caminar alternando pies
4. **Prueba de filtros**: Verificar que no se envían mediciones excesivas

**🪑 Pruebas de Medición Levantarse:**
1. **Prueba básica**: Iniciar medición levantarse y colocar peso gradualmente
2. **Prueba simultánea**: Colocar peso en ambos sensores al mismo tiempo
3. **Prueba de progresión**: Simular levantarse aumentando peso gradualmente
4. **Prueba de finalización**: Verificar que se puede finalizar manualmente

### 📊 **Respuestas del Servidor**

El servidor responderá con diferentes códigos:

```json
// Medición procesada correctamente
{"status": "success", "sessionId": 123, "measurement": {...}}

// No hay sesión activa (crear sesión primero)
{"status": "no_active_session", "message": "No hay sesión activa..."}

// Filtrado por frecuencia (normal, no es error)
{"status": "filtered_time", "message": "Medición filtrada por frecuencia"}

// Filtrado por cambio mínimo (normal, no es error)
{"status": "filtered_weight", "message": "Medición filtrada por cambio mínimo"}
```

### 🔍 **Monitoreo y Debug**

**En el monitor serie del ESP32** veréis:
- `✅ left: 45.2kg → Enviado OK` - Medición procesada
- `⚠️ left: Filtrado por servidor` - Filtrado (normal)
- `❌ left: Error 404` - No hay sesión activa

**En la aplicación web** veréis:
- Gráficos actualizándose en tiempo real
- Colores que cambian según el equilibrio
- Contador de mediciones subiendo

### 🚨 **Posibles Problemas y Soluciones**

| Problema | Causa | Solución |
|----------|-------|----------|
| Error 404 | No hay sesión activa | Crear sesión desde la web |
| Error de conexión | WiFi/Internet | Verificar conectividad |
| Mediciones no aparecen | Filtros activos | Normal si cambios < 0.5kg |
| Demasiados filtros | Frecuencia muy alta | Aumentar `SEND_INTERVAL` |

### 📞 **Contacto para Soporte**

Si tenéis algún problema durante las pruebas:
1. Enviad los logs del monitor serie
2. Indicad qué respuestas recibís del servidor
3. Especificad si la sesión está activa en la web

### 🎯 **Objetivos de las Pruebas**

- ✅ Verificar conectividad ESP32 ↔ Heroku
- ✅ Confirmar que las mediciones llegan en tiempo real
- ✅ Validar el emparejamiento automático de pies
- ✅ Probar los filtros de frecuencia
- ✅ Verificar la estabilidad durante uso prolongado

¡Estamos muy emocionados de ver el sistema funcionando con hardware real!

Saludos,
**Equipo SmartRehabBar**
