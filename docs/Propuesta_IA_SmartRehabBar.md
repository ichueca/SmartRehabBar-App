# 🤖 **Opciones de Inteligencia Artificial para SmartRehabBar**

## Propuestas para Expertos en Rehabilitación

---

## 📋 **Resumen Ejecutivo**

La Inteligencia Artificial puede ayudar a:

- **Detectar** problemas que el ojo humano podría pasar por alto
- **Predecir** el progreso del paciente
- **Sugerir** ajustes en el tratamiento
- **Alertar** sobre riesgos o cambios importantes

**Importante:** La IA es una **herramienta de apoyo**, nunca reemplaza al fisioterapeuta.

---

## 🎯 **Opción 1: Detector de Asimetrías en la Marcha**

### **¿Qué hace?**

Analiza automáticamente si el paciente carga más peso en un pie que en otro durante la marcha, y alerta cuando la diferencia es significativa.

**Ejemplo práctico:**

- Paciente con prótesis de cadera tiende a cargar más el lado sano
- El sistema detecta: "⚠️ Carga 65% en pie derecho, 35% en izquierdo"
- Alerta al fisioterapeuta para trabajar la simetría

### **¿Qué necesitamos?**

| Concepto                 | Descripción                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Datos necesarios**     | 50-100 sesiones de pacientes con marcha normal y patológica                                                    |
| **Etiquetado**           | Fisioterapeuta marca cada sesión como: "Simétrica", "Asimetría leve", "Asimetría moderada", "Asimetría severa" |
| **Tiempo de etiquetado** | 2-3 minutos por sesión (viendo el gráfico de distribución)                                                     |
| **Muestras mínimas**     | 50 sesiones para empezar, 200+ para modelo robusto                                                             |

### **¿Cómo se etiqueta?**

1. Fisioterapeuta revisa el gráfico de la sesión
2. Observa la distribución de peso izquierda-derecha
3. Clasifica según su criterio clínico
4. Opcionalmente añade notas: "Compensación por dolor", "Mejora respecto a sesión anterior"

### **¿Datos sintéticos?**

✅ **SÍ, muy útiles aquí**

- Podemos simular diferentes grados de asimetría
- Generar 1000+ sesiones sintéticas con patrones conocidos
- Útil para entrenar el modelo inicial
- **Pero:** Siempre validar con datos reales antes de usar clínicamente

---

## 🪑 **Opción 2: Evaluador de Calidad del Ejercicio Sit-to-Stand**

### **¿Qué hace?**

Evalúa automáticamente si el paciente realiza correctamente el ejercicio de levantarse desde sentado, detectando compensaciones o técnicas incorrectas.

**Ejemplo práctico:**

- Paciente se levanta apoyándose excesivamente en un lado
- Sistema detecta: "⚠️ Ejercicio mejorable - Compensación lado derecho"
- Sugiere: "Trabajar fuerza en pierna izquierda"

### **¿Qué necesitamos?**

| Concepto                 | Descripción                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Datos necesarios**     | 100-300 repeticiones del ejercicio                                                        |
| **Etiquetado**           | Fisioterapeuta clasifica cada repetición: "Excelente", "Buena", "Mejorable", "Incorrecta" |
| **Tiempo de etiquetado** | 1 minuto por repetición (viendo el gráfico de evolución)                                  |
| **Muestras mínimas**     | 100 repeticiones para empezar, 500+ para modelo robusto                                   |

### **¿Cómo se etiqueta?**

1. Fisioterapeuta observa el gráfico de peso durante el levantamiento
2. Evalúa:
   - ¿Distribución simétrica?
   - ¿Velocidad adecuada?
   - ¿Estabilidad al final?
3. Asigna calificación según criterios clínicos
4. Puede añadir observaciones: "Usa brazos para impulsarse", "Buena técnica"

### **¿Datos sintéticos?**

✅ **SÍ, moderadamente útiles**

- Podemos simular ejercicios "perfectos" y con errores típicos
- Generar 500+ repeticiones sintéticas
- Útil para modelo inicial
- **Importante:** Necesitamos datos reales para capturar variabilidad humana

---

## 📈 **Opción 3: Predictor de Progreso de Rehabilitación**

### **¿Qué hace?**

Predice cuántas sesiones necesitará el paciente para alcanzar objetivos de rehabilitación, basándose en su evolución y casos similares previos.

**Ejemplo práctico:**

- Paciente lleva 5 sesiones post-operatorio de rodilla
- Sistema analiza su progreso y casos similares
- Predice: "Estimado 12-15 sesiones más para alta"
- Ayuda a planificar y gestionar expectativas

### **¿Qué necesitamos?**

| Concepto                 | Descripción                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Datos necesarios**     | 30-50 pacientes que hayan completado rehabilitación                                     |
| **Etiquetado**           | Registrar: diagnóstico inicial, edad, número de sesiones hasta alta, métricas de mejora |
| **Tiempo de etiquetado** | 10-15 minutos por paciente (revisar historial completo)                                 |
| **Muestras mínimas**     | 30 pacientes para empezar, 100+ para predicciones fiables                               |

### **¿Cómo se etiqueta?**

1. Al dar de alta a un paciente, fisioterapeuta registra:
   - Diagnóstico inicial
   - Edad y condición física inicial
   - Total de sesiones realizadas
   - Métricas de mejora (% simetría inicial vs. final)
   - Observaciones relevantes
2. Sistema aprende patrones de casos similares

### **¿Datos sintéticos?**

❌ **NO recomendable**

- Cada paciente es único
- Demasiadas variables individuales
- Datos sintéticos no capturarían la complejidad real
- **Mejor:** Esperar a tener datos reales suficientes

---

## ⚠️ **Opción 4: Detector de Riesgo de Caída**

### **¿Qué hace?**

Analiza la estabilidad del paciente durante ejercicios y alerta si detecta patrones de inestabilidad que podrían indicar riesgo de caída.

**Ejemplo práctico:**

- Paciente mayor realizando ejercicio de equilibrio
- Sistema detecta oscilaciones excesivas
- Alerta: "⚠️ Inestabilidad detectada - Supervisión recomendada"
- Fisioterapeuta ajusta ejercicio o añade apoyo

### **¿Qué necesitamos?**

| Concepto                 | Descripción                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| **Datos necesarios**     | 100-200 sesiones con diferentes niveles de estabilidad                                         |
| **Etiquetado**           | Fisioterapeuta marca: "Estable", "Inestabilidad leve", "Inestabilidad moderada", "Riesgo alto" |
| **Tiempo de etiquetado** | 3-5 minutos por sesión (análisis de variabilidad)                                              |
| **Muestras mínimas**     | 100 sesiones para empezar, 300+ para modelo confiable                                          |

### **¿Cómo se etiqueta?**

1. Fisioterapeuta observa el gráfico de distribución de peso en tiempo real
2. Evalúa:
   - ¿Oscilaciones excesivas?
   - ¿Cambios bruscos de peso?
   - ¿Pérdida de equilibrio momentánea?
3. Clasifica según riesgo observado
4. Anota contexto: "Paciente con Parkinson", "Primer día post-operatorio"

### **¿Datos sintéticos?**

⚠️ **Con precaución**

- Podemos simular oscilaciones y patrones de inestabilidad
- Útil para modelo inicial
- **Crítico:** Validación exhaustiva con datos reales antes de uso clínico
- **Riesgo:** Falsos negativos podrían ser peligrosos

---

## 📊 **Comparativa de Opciones**

| Criterio                     | Asimetrías | Calidad Sit-to-Stand | Progreso        | Riesgo Caída   |
| ---------------------------- | ---------- | -------------------- | --------------- | -------------- |
| **Facilidad implementación** | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐                 | ⭐⭐              | ⭐⭐⭐            |
| **Datos necesarios**         | 50-100     | 100-300              | 30-50 pacientes | 100-200        |
| **Tiempo etiquetado**        | Bajo       | Bajo                 | Alto            | Medio          |
| **Utilidad clínica**         | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐                | ⭐⭐⭐⭐            | ⭐⭐⭐⭐⭐          |
| **Datos sintéticos viables** | ✅ Sí       | ⚠️ Parcial           | ❌ No            | ⚠️ Con cuidado |
| **Riesgo si falla**          | Bajo       | Bajo                 | Bajo            | **Alto**       |

---

## 🏆 **Recomendación: Por Dónde Empezar**

### **Fase 1: Detector de Asimetrías** (2-4 semanas)

**Por qué empezar aquí:**

- ✅ Más simple de implementar
- ✅ Resultados rápidos
- ✅ Datos sintéticos viables para prototipo
- ✅ Bajo riesgo si falla
- ✅ Útil desde el primer día

**Plan:**

1. Generar 500 sesiones sintéticas con diferentes grados de asimetría
2. Entrenar modelo inicial
3. Validar con 20-30 sesiones reales etiquetadas por fisioterapeuta
4. Ajustar y desplegar

---

### **Fase 2: Evaluador Sit-to-Stand** (1-2 meses)

**Por qué continuar aquí:**

- ✅ Alto valor clínico
- ✅ Feedback inmediato al paciente
- ✅ Datos estructurados (fácil de entrenar)
- ✅ Complementa bien la Fase 1

**Plan:**

1. Recolectar 100 repeticiones reales del ejercicio
2. Fisioterapeuta etiqueta cada una (1-2 horas total)
3. Entrenar clasificador
4. Validar con nuevas repeticiones
5. Integrar en la aplicación

---

### **Fase 3: Predictor de Progreso** (3-6 meses)

**Por qué dejarlo para después:**

- ⚠️ Requiere datos históricos completos
- ⚠️ Necesita pacientes que hayan completado rehabilitación
- ⚠️ Más complejo de validar

**Plan:**

1. Esperar a tener 30+ pacientes con rehabilitación completa
2. Analizar patrones de progreso
3. Entrenar modelo predictivo
4. Validar con casos nuevos

---

## 🛠️ **Aspectos Técnicos (Para Desarrolladores)**

### **Stack Tecnológico Propuesto**

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - Muestra predicciones IA              │
│  - Alertas visuales                     │
│  - Gráficos con insights                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Backend Node.js (Actual)           │
│  - Recibe mediciones                    │
│  - Guarda en PostgreSQL                 │
│  - Llama a servicio ML                  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    Servicio ML (Python/FastAPI)         │
│  - scikit-learn / XGBoost               │
│  - Endpoint: POST /predict              │
│  - Retorna: clasificación + confianza   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         PostgreSQL                      │
│  - Mediciones históricas                │
│  - Etiquetas de entrenamiento           │
│  - Predicciones guardadas               │
└─────────────────────────────────────────┘
```

### **Modelos Recomendados**

| Tarea        | Modelo                     | Librería     | Por qué                        |
| ------------ | -------------------------- | ------------ | ------------------------------ |
| Asimetrías   | Random Forest              | scikit-learn | Simple, interpretable, robusto |
| Sit-to-Stand | SVM o XGBoost              | scikit-learn | Bueno con datos tabulares      |
| Progreso     | Regresión Lineal → XGBoost | scikit-learn | Empezar simple, evolucionar    |
| Riesgo Caída | Isolation Forest           | scikit-learn | Detección de anomalías         |

**NO usar Deep Learning:**

- ❌ Overkill para estos datos
- ❌ Requiere muchos más datos
- ❌ Difícil de interpretar
- ❌ Más lento en inferencia

---

## ⚖️ **Consideraciones Éticas y Legales**

### **Privacidad de Datos (GDPR/LOPD)**

- 🔒 Datos médicos = Categoría especial
- 📝 Consentimiento informado obligatorio
- 🔐 Anonimización para entrenamiento
- 🗑️ Derecho al olvido

### **Responsabilidad Médica**

- 👨‍⚕️ IA como **asistente**, no decisor
- 📋 Fisioterapeuta siempre supervisa
- 📊 Predicciones como "sugerencias"
- ⚠️ Disclaimers claros en la interfaz

### **Explicabilidad**

- 🔍 Poder justificar cada predicción
- 📈 Mostrar qué factores influyeron
- 📝 Logging de todas las decisiones
- 🧪 Auditoría periódica del modelo

### **Validación Clínica**

- 🏥 Colaboración con fisioterapeutas
- 📊 Métricas clínicas, no solo técnicas
- 🧪 Periodo de prueba supervisado
- 📈 Monitoreo continuo de rendimiento

---

## 📋 **Proceso de Etiquetado: Guía Práctica**

### **Herramienta de Etiquetado**

Podemos añadir a la aplicación actual:

1. **Modo "Etiquetado"** en el detalle de sesión
2. Fisioterapeuta ve el gráfico
3. Selecciona clasificación de un menú desplegable
4. Opcionalmente añade notas
5. Se guarda en BD con timestamp y usuario

### **Ejemplo de Interfaz**

```
┌─────────────────────────────────────────┐
│  Sesión #123 - Juan Pérez               │
│  Fecha: 2026-03-24                      │
├─────────────────────────────────────────┤
│  [Gráfico de distribución de peso]      │
├─────────────────────────────────────────┤
│  Etiquetar esta sesión:                 │
│  ┌─────────────────────────────────┐    │
│  │ Seleccionar clasificación ▼     │    │
│  │  - Simétrica                    │    │
│  │  - Asimetría leve               │    │
│  │  - Asimetría moderada           │    │
│  │  - Asimetría severa             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Notas (opcional):                      │
│  ┌─────────────────────────────────┐    │
│  │ Compensación por dolor rodilla  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Guardar Etiqueta]                     │
└─────────────────────────────────────────┘
```

---

## 🎯 **Métricas de Éxito**

### **Técnicas** (cómo de bien mide el modelo)

**Precisión:** >85% en validación cruzada

**Recall:** >90% para casos críticos (riesgo caída)

**F1-Score:** >0.80

**Tiempo de inferencia:** <100ms 

##### **Precisión (Accuracy)**

* **Qué es:** % de predicciones correctas sobre el total
* **Ejemplo:** Si el modelo hace 100 predicciones y acierta 85 → Precisión = 85%
* **Meta:** >85%
* **Por qué importa:** Indica fiabilidad general del modelo

##### **Recall (Sensibilidad)**

* **Qué es:** % de casos positivos que el modelo detecta correctamente
* **Ejemplo:** De 10 pacientes con riesgo de caída real, el modelo detecta 9 → Recall = 90%
* **Meta:** >90% para casos críticos (riesgo caída)
* **Por qué importa:** Evita falsos negativos (no detectar un problema real)

##### **F1-Score**

* **Qué es:** Balance entre precisión y recall (media armónica)
* **Rango:** 0 a 1 (1 = perfecto)
* **Meta:** >0.80
* **Por qué importa:** Asegura que el modelo es bueno en ambos aspectos

##### **Tiempo de Inferencia**

* **Qué es:** Cuánto tarda el modelo en hacer una predicción
* **Meta:** <100ms (milisegundos)
* **Por qué importa:** Debe ser instantáneo para no ralentizar la aplicación

### **Clínicas**

- **Acuerdo con experto:** >80% (Cohen's Kappa)
- **Falsos positivos:** <15%
- **Falsos negativos críticos:** <5%
- **Satisfacción fisioterapeutas:** >4/5

##### **Acuerdo con Experto (Cohen's Kappa)**

* **Qué es:** Mide cuánto coincide el modelo con el fisioterapeuta
* **Rango:** -1 a 1 (>0.80 = acuerdo excelente)
* **Meta:** >0.80
* **Ejemplo:** Fisioterapeuta y modelo clasifican 100 sesiones. Coinciden en 85 → Kappa ≈ 0.82
* **Por qué importa:** Valida que el modelo "piensa" como un experto

##### **Falsos Positivos**

* **Qué es:** % de veces que el modelo alerta sin razón
* **Meta:** <15%
* **Ejemplo:** Modelo dice "asimetría severa" pero el fisioterapeuta ve que es normal
* **Por qué importa:** Demasiadas falsas alarmas → Fisioterapeutas ignoran el sistema

##### **Falsos Negativos Críticos**

* **Qué es:** % de veces que el modelo NO alerta cuando debería (en casos graves)
* **Meta:** <5%
* **Ejemplo:** Paciente con riesgo de caída pero el modelo dice "todo bien"
* **Por qué importa:** Puede ser peligroso para el paciente

##### **Satisfacción Fisioterapeutas**

* **Qué es:** Encuesta de satisfacción (escala 1-5)
* **Meta:** >4/5
* **Preguntas típicas:**
  * ¿Las predicciones son útiles?
  * ¿Confías en las alertas?
  * ¿Te ahorra tiempo?
* **Por qué importa:** Si no lo usan, no sirve de nada

### **Operacionales**

- **Tiempo de etiquetado:** <3 min/sesión
- **Datos necesarios:** Alcanzables en 2-3 meses
- **Coste computacional:** Mínimo (CPU suficiente)

##### **Tiempo de Etiquetado**

* **Qué es:** Cuánto tarda un fisioterapeuta en etiquetar una sesión
* **Meta:** <3 minutos/sesión
* **Por qué importa:** Si es muy lento, no conseguiremos datos suficientes

##### **Datos Necesarios**

* **Qué es:** Cuántas sesiones/pacientes necesitamos
* **Meta:** Alcanzables en 2-3 meses de uso normal
* **Ejemplo:** 100 sesiones = ~5 pacientes con 20 sesiones cada uno
* **Por qué importa:** Debe ser realista con el volumen de la clínica

##### **Coste Computacional**

* **Qué es:** Recursos de servidor necesarios
* **Meta:** CPU suficiente (no necesita GPU)
* **Por qué importa:** Mantiene costes bajos (~$25-50/mes)

---

## 💰 **Estimación de Recursos**

### **Tiempo de Desarrollo**

- **Fase 1 (Asimetrías):** 2-4 semanas
- **Fase 2 (Sit-to-Stand):** 4-6 semanas
- **Fase 3 (Progreso):** 8-12 semanas

### **Tiempo de Fisioterapeutas**

- **Etiquetado Fase 1:** 2-3 horas (100 sesiones)
- **Etiquetado Fase 2:** 2-3 horas (100 repeticiones)
- **Validación:** 1 hora/semana durante desarrollo

### **Infraestructura**

- **Servidor ML:** Heroku Dyno Standard ($25/mes)
- **Almacenamiento:** Incluido en PostgreSQL actual
- **Total adicional:** ~$25-50/mes

---

## 🚀 **Próximos Pasos Concretos**

### **Inmediatos (Esta Semana)**

1. ✅ Revisar esta propuesta con equipo de fisioterapia
2. ✅ Decidir qué opción priorizar
3. ✅ Definir criterios de etiquetado específicos

### **Corto Plazo (2-4 Semanas)**

1. Implementar interfaz de etiquetado en la app
2. Generar datos sintéticos para prototipo
3. Entrenar modelo inicial
4. Validar con primeros datos reales

### **Medio Plazo (2-3 Meses)**

1. Recolectar 100+ sesiones etiquetadas
2. Entrenar modelo robusto
3. Integrar en producción con modo "beta"
4. Recoger feedback de usuarios

---

## 📚 **Recursos Adicionales**

### **Para Fisioterapeutas**

- [Guía de Etiquetado de Datos Médicos](https://example.com)
- [Interpretación de Predicciones de IA](https://example.com)

### **Para Desarrolladores**

- [scikit-learn Documentation](https://scikit-learn.org)
- [FastAPI + ML Tutorial](https://fastapi.tiangolo.com)
- [MLOps Best Practices](https://ml-ops.org)

---

## ❓ **Preguntas Frecuentes**

**P: ¿Necesitamos muchos datos?**
R: Depende de la opción. Para asimetrías, 50-100 sesiones son suficientes para empezar. Para progreso, necesitamos más (30+ pacientes completos).

**P: ¿Podemos usar datos sintéticos?**
R: Sí para prototipo inicial, pero siempre validar con datos reales antes de uso clínico.

**P: ¿Qué pasa si el modelo se equivoca?**
R: Por eso el fisioterapeuta siempre supervisa. La IA sugiere, el humano decide.

**P: ¿Es caro?**
R: No. Con ~$25-50/mes adicionales en infraestructura es suficiente.

**P: ¿Cuánto tiempo lleva?**
R: Fase 1 (asimetrías) puede estar lista en 2-4 semanas.

---

**Documento creado:** 2026-03-24
**Versión:** 1.0


