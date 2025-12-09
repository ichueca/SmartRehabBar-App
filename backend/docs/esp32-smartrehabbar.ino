/*
 * SmartRehabBar - Código ESP32 para Sensores de Peso
 * 
 * Este código envía mediciones de peso de dos sensores (pie izquierdo y derecho)
 * al servidor SmartRehabBar desplegado en Heroku.
 * 
 * Características:
 * - Control automático de frecuencia (máximo 10 Hz)
 * - Filtro de cambio mínimo (0.5kg)
 * - Manejo de errores y reconexión WiFi
 * - Logs detallados para debugging
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==================== CONFIGURACIÓN ====================
// WiFi
const char* ssid = "VUESTRO_WIFI";
const char* password = "VUESTRA_PASSWORD";

// Servidor SmartRehabBar
const char* serverURL = "https://smartrehabbar-demo-7f620514b4ed.herokuapp.com";

// Control de frecuencia
const unsigned long SEND_INTERVAL = 100; // Mínimo 100ms entre envíos (10 Hz máximo)
const float MIN_WEIGHT_CHANGE = 0.5;     // Mínimo 0.5kg de cambio para enviar
const float MIN_SIGNIFICANT_WEIGHT = 5.0; // Peso mínimo para considerar (filtrar ruido)

// ==================== VARIABLES GLOBALES ====================
unsigned long lastSendTime = 0;
float lastWeightLeft = -1;
float lastWeightRight = -1;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 SmartRehabBar ESP32 - Iniciando...");
  
  // Conectar a WiFi
  connectToWiFi();
  
  // Inicializar sensores (implementar según vuestro hardware)
  initializeSensors();
  
  Serial.println("✅ Sistema listo para enviar mediciones");
  Serial.println("📋 Crear sesión en: " + String(serverURL));
  Serial.println("=====================================");
}

// ==================== LOOP PRINCIPAL ====================
void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado, reconectando...");
    connectToWiFi();
    return;
  }
  
  // Leer sensores usando las funciones que debéis implementar
  float pesoIzquierdo = leerSensorIzquierdo();  // Implementar según vuestro hardware
  float pesoDerecho = leerSensorDerecho();      // Implementar según vuestro hardware
  
  // Enviar mediciones (solo si hay peso significativo)
  if (pesoIzquierdo > MIN_SIGNIFICANT_WEIGHT) {
    sendMeasurement("left", pesoIzquierdo);
  }
  
  if (pesoDerecho > MIN_SIGNIFICANT_WEIGHT) {
    sendMeasurement("right", pesoDerecho);
  }
  
  // Pausa entre lecturas (20 Hz de lectura, pero envío filtrado)
  delay(50);
}

// ==================== FUNCIONES DE COMUNICACIÓN ====================
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("🔗 Conectando a WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi conectado!");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("🌐 Servidor: ");
    Serial.println(serverURL);
  } else {
    Serial.println();
    Serial.println("❌ Error conectando a WiFi");
    delay(5000); // Esperar antes de reintentar
  }
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
  
  // Crear URL con parámetros
  HTTPClient http;
  String url = String(serverURL) + "/api/hardware/" + foot + "?peso=" + String(weight, 1);
  
  http.begin(url);
  http.setTimeout(5000); // Timeout de 5 segundos
  http.addHeader("User-Agent", "SmartRehabBar-ESP32/1.0");
  
  // Enviar petición GET
  int httpCode = http.GET();
  
  // Procesar respuesta
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ " + foot + ": " + String(weight, 1) + "kg → OK");
    
    // Actualizar último peso enviado
    *lastWeight = weight;
    lastSendTime = currentTime;
    
    // Opcional: mostrar respuesta del servidor para debug
    // Serial.println("   Respuesta: " + response);
    
  } else if (httpCode == 429) {
    Serial.println("⚠️ " + foot + ": Filtrado por servidor (frecuencia)");
  } else if (httpCode == 404) {
    Serial.println("⚠️ " + foot + ": No hay sesión activa");
  } else if (httpCode > 0) {
    Serial.println("❌ " + foot + ": Error HTTP " + String(httpCode));
    String response = http.getString();
    Serial.println("   Respuesta: " + response);
  } else {
    Serial.println("❌ " + foot + ": Error de conexión " + String(httpCode));
  }
  
  http.end();
}

// ==================== FUNCIONES DE SENSORES ====================
// ESTAS FUNCIONES DEBÉIS IMPLEMENTARLAS SEGÚN VUESTRO HARDWARE

void initializeSensors() {
  Serial.println("🔧 Inicializando sensores...");
  
  // TODO: Implementar inicialización de vuestros sensores
  // Ejemplo:
  // - Configurar pines ADC
  // - Calibrar sensores de peso
  // - Configurar amplificadores (HX711, etc.)
  
  Serial.println("✅ Sensores inicializados");
}

float leerSensorIzquierdo() {
  // TODO: Implementar lectura del sensor del pie izquierdo
  // 
  // Ejemplo con HX711:
  // return scale_left.get_units(1); // Leer y convertir a kg
  //
  // Ejemplo con ADC directo:
  // int rawValue = analogRead(PIN_SENSOR_LEFT);
  // float voltage = rawValue * (3.3 / 4095.0);
  // float weight = convertVoltageToWeight(voltage);
  // return weight;
  
  // PLACEHOLDER - Reemplazar con código real
  return 0.0;
}

float leerSensorDerecho() {
  // TODO: Implementar lectura del sensor del pie derecho
  // Similar a leerSensorIzquierdo() pero para el sensor derecho
  
  // PLACEHOLDER - Reemplazar con código real
  return 0.0;
}

// ==================== FUNCIONES AUXILIARES ====================
float convertVoltageToWeight(float voltage) {
  // TODO: Implementar conversión de voltaje a peso según vuestros sensores
  // Esta función depende completamente de vuestro hardware específico
  
  // Ejemplo genérico (ajustar según calibración):
  // float weight = (voltage - offset) * scale_factor;
  // return max(0.0, weight); // No permitir pesos negativos
  
  return 0.0;
}
