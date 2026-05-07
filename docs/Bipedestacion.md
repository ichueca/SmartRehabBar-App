# Bipedestación

## Objetivo

Añadir un ejercicio independiente de equilibrio en bipedestación, en tiempo real y sin persistencia.

La funcionalidad debe:

- mostrar el porcentaje de carga en cada pie
- indicar si el usuario está equilibrado o no
- decir qué pie debe cargar más
- funcionar con pantalla táctil
- ofrecer modo visual adulto e infantil
- permitir audio opcional por auriculares

## Alcance funcional

- No requiere paciente ni sesión clínica.
- No guarda resultados en base de datos.
- Se ejecuta como modo live temporal en memoria.
- Reutiliza la lectura del hardware y Socket.IO.

## Configuración inicial

Antes de iniciar el ejercicio se puede seleccionar:

- reparto objetivo entre pies
- modo visual (`adult` o `child`)
- audio activado o desactivado
- umbrales de tolerancia en ajustes avanzados

## Objetivos de reparto

Presets táctiles previstos:

- `50 / 50`
- `60 / 40`
- `70 / 30`
- `80 / 20`
- `100 / 0`
- `0 / 100`

Además, se permite ajuste fino con botones `+ / -`.

## Estados del ejercicio

### 1. Espera

Mientras no se detecta suficiente peso total:

- mensaje: `Súbete a la plataforma`
- sin correcciones de equilibrio

### 2. OK

Dentro de la tolerancia objetivo.

- color verde
- mensaje: `Equilibrado`

### 3. Desvío leve

Fuera de la zona OK pero cerca del objetivo.

- color amarillo
- mensaje: `Pon un poco más de peso en el pie izquierdo/derecho`

### 4. Desvío grande

Fuera claramente del objetivo.

- color rojo
- mensaje: `Pon más peso en el pie izquierdo/derecho`

## Umbrales por defecto

- OK: `±3%`
- desvío leve: `>3% y ≤7%`
- desvío grande: `>7%`

Los umbrales son configurables antes de iniciar.

## Modo adulto

La interfaz debe mostrar:

- porcentaje grande de cada pie
- peso estimado por pie
- barra de equilibrio con objetivo y posición actual
- mensaje grande de corrección

## Modo infantil

La lógica es la misma que en modo adulto, pero la visualización cambia:

- personaje sobre balancín
- 5 estados visuales
  - mucho a la izquierda
  - poco a la izquierda
  - equilibrado
  - poco a la derecha
  - mucho a la derecha

## Audio

Si el audio está activado:

- se emite un pitido lateralizado
  - auricular izquierdo si hay que cargar más el pie izquierdo
  - auricular derecho si hay que cargar más el pie derecho
- se locuta el mensaje de corrección con voz del navegador

Reglas:

- pensado para auriculares
- no debe repetirse continuamente
- se limita la frecuencia de avisos

## Backend

Se añade un servicio en memoria para Bipedestación:

- inicio del ejercicio
- consulta de estado
- parada del ejercicio
- cálculo live de porcentajes y recomendación
- suavizado básico de señal

## Endpoints

- `POST /api/bipedestation/start`
- `GET /api/bipedestation/status`
- `POST /api/bipedestation/stop`

## Eventos Socket.IO

- `bipedestation:started`
- `bipedestation:update`
- `bipedestation:ended`

## Integración con hardware

Mientras Bipedestación está activa, las mediciones de `/api/hardware/:foot`:

- no se guardan en base de datos
- se procesan en memoria
- se convierten en porcentaje y recomendación
- se emiten al frontend en tiempo real

## Restricciones

- no puede coexistir con una sesión activa de pisadas
- no puede coexistir con una sesión activa de sit-to-stand

## MVP implementado

- modo live sin persistencia
- configuración táctil
- modo adulto
- modo infantil básico
- audio opcional con pitido lateral + locución
- feedback en tiempo real por Socket.IO