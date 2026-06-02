# IA experimental para interpretación de patrones Sit-to-Stand

## Objetivo

Este módulo se ha añadido para cubrir el objetivo `2.4 Investigar y aplicar un modelo de IA sencillo para la interpretación de patrones`.

La implementación busca ser:

- simple
- explicable
- fácil de desplegar en local, Heroku y Raspberry Pi
- no intrusiva para el flujo clínico habitual

## Caso de uso elegido

Se aplica sobre los resultados de **Sit-to-Stand** (`levantarse`).

La aplicación genera una tarjeta llamada **Interpretación IA experimental** en la pantalla de resultados.

## Tipo de modelo

Se utiliza un modelo muy ligero de tipo **weighted nearest centroid**.

Este modelo:

- representa cada clase mediante un centroide
- normaliza las variables de entrada
- calcula una distancia ponderada entre la sesión actual y cada clase
- devuelve la clase más cercana

## Clases de salida

- `balanced` → Equilibrado
- `compensate_left` → Compensación hacia la izquierda
- `compensate_right` → Compensación hacia la derecha

Además, se calcula una severidad complementaria:

- `estable`
- `leve`
- `moderada`
- `marcada`

## Variables de entrada del modelo

El modelo usa cuatro variables derivadas de la sesión Sit-to-Stand:

1. **symmetryPercentage**
   - porcentaje de simetría entre ambos lados
2. **leftDominance**
   - dominancia lateral en función de la diferencia entre máximos izquierdo y derecho
3. **durationSeconds**
   - duración total del gesto
4. **distributionStd**
   - variabilidad del reparto de carga durante la secuencia

## Proceso de entrenamiento

No se ha entrenado con datos clínicos reales, ya que el objetivo de esta fase es demostrar una integración mínima de IA.

En su lugar, se ha usado un **conjunto sintético determinista** generado a partir de reglas simples.

### Script de entrenamiento

- `backend/src/scripts/train-sit-to-stand-ai.js`

### Salida del entrenamiento

- `backend/src/ai-models/sitToStandModel.json`

### Cómo funciona el entrenamiento

1. Se generan muestras sintéticas para tres clases:
   - equilibrado
   - compensación izquierda
   - compensación derecha
2. Se calculan medias y desviaciones estándar globales para normalización
3. Se normalizan las muestras
4. Se calcula un centroide por clase
5. Se guarda el modelo como JSON

## Integración en la aplicación

### Backend

Archivo principal:

- `backend/src/services/sitToStandAiService.js`

Este servicio:

- carga el modelo JSON
- extrae variables desde la sesión Sit-to-Stand
- normaliza las variables
- calcula distancias a centroides
- devuelve etiqueta, severidad, confianza y explicación

### Punto de integración

La interpretación se añade en:

- `backend/src/services/sitToStandService.js`

Concretamente al devolver:

- una sesión finalizada
- una sesión recuperada por ID

### Frontend

La tarjeta de resultado se muestra en:

- `frontend/src/pages/SitToStandResults.jsx`

## Razones para esta elección

Se ha elegido este enfoque porque:

- cumple el objetivo de introducir IA en el proyecto
- no añade dependencias pesadas
- no requiere un servicio Python independiente
- se puede explicar fácilmente en la documentación del proyecto
- mantiene una integración sencilla y estable

## Limitaciones

- no está entrenado con datos reales de pacientes
- no debe interpretarse como herramienta diagnóstica
- su finalidad actual es demostrativa y de investigación aplicada

## Regenerar el modelo

Desde `backend/`:

```bash
npm run train:sit-to-stand-ai
```

## Nota final

La interfaz indica explícitamente que se trata de una **interpretación IA experimental** y que **no sustituye la valoración clínica**.