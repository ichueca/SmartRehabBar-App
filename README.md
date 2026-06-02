# 🏥 SmartRehabBar

Sistema de Rehabilitación Inteligente con monitoreo en tiempo real de distribución de peso durante terapia física.

## 📋 Descripción

SmartRehabBar es una aplicación web completa que permite monitorear en tiempo real la distribución de peso entre ambos pies durante sesiones de rehabilitación. El sistema utiliza sensores de presión conectados a una barra de rehabilitación para capturar mediciones y proporcionar feedback inmediato al terapeuta.

## ✨ Características

### Backend (Node.js + Express)

- ✅ API REST completa para gestión de pacientes, sesiones y mediciones
- ✅ Base de datos SQLite local con Prisma ORM
- ✅ Socket.IO para comunicación en tiempo real
- ✅ Sincronización automática de mediciones izquierda/derecha
- ✅ Cálculo de balance y estadísticas en tiempo real
- ✅ Validación de datos y manejo de errores

### Frontend (React + Vite)

- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de pacientes
- ✅ Historial de sesiones con gráficos
- ✅ Monitoreo en vivo de sesiones activas
- ✅ Ejercicio independiente de bipedestación en tiempo real
- ✅ Visualización de balance con gráficos interactivos (Recharts)
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Actualización automática vía Socket.IO

## 🚀 Instalación

> El repositorio incluye **todo el código fuente** del proyecto: `frontend`, `backend` y documentación técnica.  
> Para instalación local detallada, consulta `docs/INSTALACION_LOCAL.md`.

Documentación operativa local adicional:

- `docs/USO_LOCAL.md`
- `docs/COPIAS_SEGURIDAD.md`
- `docs/ACTUALIZACION_LOCAL.md`
- `docs/INSTALACION_RASPBERRY_PI.md`

### Requisitos Previos

- Node.js 18 LTS o superior (recomendado 20 LTS)
- npm o yarn

### Arranque rápido en Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

Esto deja la aplicación disponible en `http://localhost:5000` usando SQLite local.

También se puede hacer doble clic en:

- `Instalar SmartRehabBar.bat`
- `Iniciar SmartRehabBar.bat`

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd SmartRehabBar
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:

```env
DATABASE_URL="file:./data/smartrehabbar.db"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Inicializar base de datos:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

### Instalación local recomendada

Para uso en portátil o equipo de escritorio hay dos modos:

- **Modo desarrollo**: backend y frontend por separado (`npm run dev` en ambos)
- **Modo despliegue local**: compilar frontend con `npm run build` y arrancar backend en producción para servir toda la aplicación desde `http://localhost:5000`

La guía completa paso a paso está en `docs/INSTALACION_LOCAL.md`.

## 🎮 Uso

### Iniciar Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

### Iniciar Frontend

```bash
cd frontend
npm run dev -- --port 3000
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Funcionalidades Principales

### 1. Dashboard

- Vista general del sistema
- Estadísticas en tiempo real
- Sesiones recientes
- Mediciones en vivo

### 2. Gestión de Pacientes

- Crear, editar y eliminar pacientes
- Ver historial de sesiones por paciente
- Iniciar nuevas sesiones

### 3. Sesiones

- Filtrar por activas/finalizadas
- Ver detalles completos de cada sesión
- Estadísticas de balance
- Gráficos de mediciones

### 4. Monitoreo en Vivo

- Visualización en tiempo real de mediciones
- Balance promedio actualizado automáticamente
- Gráfico de últimas 20 pisadas
- Finalizar sesión con notas

### 5. Bipedestación

- Ejercicio independiente sin paciente ni persistencia
- Reparto objetivo configurable entre ambos pies
- Modo adulto e infantil
- Feedback visual inmediato con porcentajes y corrección
- Audio opcional para auriculares

## 🔌 API Endpoints

### Pacientes

- `GET /api/patients` - Listar todos los pacientes
- `GET /api/patients/:id` - Obtener un paciente
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente

### Sesiones

- `GET /api/sessions` - Listar todas las sesiones
- `GET /api/sessions/:id` - Obtener una sesión
- `POST /api/sessions` - Iniciar sesión
- `PATCH /api/sessions/:id` - Finalizar sesión

### Mediciones

- `POST /api/measurements/left` - Registrar medición izquierda
- `POST /api/measurements/right` - Registrar medición derecha
- `GET /api/measurements/sessions/:id/measurements` - Obtener mediciones de una sesión

### Bipedestación

- `POST /api/bipedestation/start` - Iniciar ejercicio de bipedestación
- `GET /api/bipedestation/status` - Obtener estado actual del ejercicio
- `POST /api/bipedestation/stop` - Finalizar ejercicio de bipedestación

## 📡 Eventos Socket.IO

### Eventos del Servidor

- `measurement:new` - Nueva medición registrada
- `session:started` - Sesión iniciada
- `session:ended` - Sesión finalizada
- `bipedestation:started` - Ejercicio de bipedestación iniciado
- `bipedestation:update` - Actualización live de equilibrio
- `bipedestation:ended` - Ejercicio de bipedestación finalizado

### Conexión

```javascript
import { io } from 'socket.io-client'
const socket = io('http://localhost:5000')

socket.on('measurement:new', (data) => {
  console.log('Nueva medición:', data)
})
```

## 🧪 Pruebas

### Probar API con PowerShell

```powershell
# Crear paciente
Invoke-RestMethod -Uri "http://localhost:5000/api/patients" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Paciente Prueba"}'

# Iniciar sesión
Invoke-RestMethod -Uri "http://localhost:5000/api/sessions" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"patientId":1}'

# Enviar medición izquierda
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Invoke-RestMethod -Uri "http://localhost:5000/api/measurements/left" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"sessionId`":1,`"weight`":65,`"duration`":800,`"timestamp`":`"$timestamp`"}"

# Enviar medición derecha (inmediatamente después)
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Invoke-RestMethod -Uri "http://localhost:5000/api/measurements/right" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"sessionId`":1,`"weight`":68,`"duration`":850,`"timestamp`":`"$timestamp`"}"
```

## 🏗️ Arquitectura

```
SmartRehabBar/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Esquema de base de datos
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.js       # Constantes del sistema
│   │   ├── middleware/
│   │   │   ├── errorHandler.js   # Manejo de errores
│   │   │   └── validation.js     # Validación de datos
│   │   ├── routes/
│   │   │   ├── patients.js       # Rutas de pacientes
│   │   │   ├── sessions.js       # Rutas de sesiones
│   │   │   └── measurements.js   # Rutas de mediciones
│   │   ├── services/
│   │   │   ├── measurementService.js  # Lógica de mediciones
│   │   │   ├── sessionService.js      # Lógica de sesiones
│   │   │   └── socketService.js       # Socket.IO
│   │   └── server.js              # Servidor principal
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx         # Layout principal
    │   ├── context/
    │   │   └── SocketContext.jsx  # Contexto Socket.IO
    │   ├── pages/
    │   │   ├── Dashboard.jsx      # Dashboard principal
    │   │   ├── Patients.jsx       # Gestión de pacientes
    │   │   ├── PatientDetail.jsx  # Detalle de paciente
    │   │   ├── Sessions.jsx       # Lista de sesiones
    │   │   ├── SessionDetail.jsx  # Detalle de sesión
    │   │   └── ActiveSession.jsx  # Monitoreo en vivo
    │   ├── services/
    │   │   └── api.js             # Cliente API REST
    │   ├── App.jsx                # Componente raíz
    │   ├── main.jsx               # Punto de entrada
    │   └── index.css              # Estilos globales
    └── package.json
```

## 🛠️ Tecnologías Utilizadas

### Backend

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM para SQLite / PostgreSQL
- **Socket.IO** - Comunicación en tiempo real
- **SQLite** - Base de datos local por archivo

### Frontend

- **React 18** - Librería UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Socket.IO Client** - Cliente WebSocket
- **Recharts** - Gráficos
- **Tailwind CSS** - Estilos
- **date-fns** - Manejo de fechas

## 📊 Modelo de Datos

### Patient (Paciente)

- id, name, dateOfBirth, diagnosis, notes, createdAt

### Session (Sesión)

- id, patientId, startTime, endTime, notes, createdAt

### Measurement (Medición)

- id, sessionId, foot, weight, duration, timestamp, pairedMeasurementId

## 📝 Licencia

Este proyecto es de código abierto y está disponible para fines educativos.

## 👥 Autor

Proyecto desarrollado por [Iñigo Chueca](mailto:inigo.chueca@zabalburu.org)  ([Zabalburu Ikastextxea](https://www.zabalburu.org)), Jonathan Arizala ([La Salle Berrozpe](https://lasalleberrozpe.eus)) y Ainhoa Domínguez ([Nazaret Zentroa](https://nazaret.eus/)) para el proyecto de innovación SmartRehabBar subvencionado por el Gobierno Vasco a través de [Tknika](https://tknika.eus/) 

---

**¡Disfruta usando SmartRehabBar!** 🎉
