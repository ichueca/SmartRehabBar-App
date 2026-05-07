# Instalación local de SmartRehabBar

Esta guía describe cómo instalar y ejecutar SmartRehabBar en un **portátil o equipo de escritorio** con el código fuente completo del repositorio.

## 1. Objetivo

La instalación local sirve para:

- probar la aplicación en un equipo real
- validar el flujo antes de pasar a Raspberry Pi
- disponer de una base reutilizable para otros centros

## 2. Requisitos previos

- **Node.js 18 LTS o superior** (recomendado Node.js 20 LTS)
- **npm** (incluido normalmente con Node.js)
- Navegador actualizado (Chrome, Edge o similar)
- Git opcional, si el proyecto se clona desde repositorio

> No hace falta instalar PostgreSQL. La aplicación usa **SQLite** en local.

## Inicio rápido en Windows

Desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

Esto instala dependencias, prepara SQLite y arranca la aplicación unificada en `http://localhost:5000`.

También se puede hacer doble clic en:

- `Instalar SmartRehabBar.bat`
- `Iniciar SmartRehabBar.bat`

## 3. Estructura del repositorio

El repositorio debe incluir:

- `backend/`
- `frontend/`
- `docs/`

No se separa el código fuente en otro repositorio en esta fase.

## 4. Descargar el proyecto

### Opción A: clonar

```bash
git clone <url-del-repositorio>
cd SmartRehabBar
```

### Opción B: ZIP

- descargar el ZIP
- descomprimirlo
- abrir una terminal en la carpeta raíz del proyecto

## 5. Configurar backend

Ir a la carpeta del backend e instalar dependencias:

```bash
cd backend
npm install
```

Crear el archivo `.env` a partir de `backend/.env.example`.

Contenido recomendado para local:

```env
DATABASE_URL="file:./data/smartrehabbar.db"
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

Inicializar Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

## 6. Configurar frontend

En otra terminal:

```bash
cd frontend
npm install
```

## 7. Modo 1: ejecución en desarrollo

Recomendado para ajustes, pruebas y validación funcional.

### Terminal 1 - backend

```bash
cd backend
npm run dev
```

### Terminal 2 - frontend

```bash
cd frontend
npm run dev -- --port 3000
```

Acceso:

- Frontend: `http://localhost:3000`
- Backend/API: `http://localhost:5000`

## 8. Modo 2: despliegue local unificado

Recomendado para probar una instalación más cercana a producción.

### Paso 1: compilar frontend

```bash
cd frontend
npm run build
```

### Paso 2: arrancar backend sirviendo también el frontend

En la terminal del backend, usar entorno de producción.

#### PowerShell (Windows)

```powershell
cd backend
$env:NODE_ENV="production"
node src/server.js
```

Acceso:

- Aplicación completa: `http://localhost:5000`

## 9. Prueba funcional mínima

Una vez arrancada la aplicación:

1. abrir Dashboard
2. comprobar que no hay errores visibles
3. entrar en **Bipedestación**
4. iniciar el ejercicio
5. opcionalmente lanzar simulación demo desde backend:

```bash
npm run simulate:bipedestation
```

## 10. Base de datos local

La base de datos SQLite se guarda en:

`backend/data/smartrehabbar.db`

Esto facilita:

- copias de seguridad
- traslado a otros equipos
- uso sin servidor de base de datos

## 11. Problemas frecuentes

### El puerto 3000 o 5000 está ocupado

- cerrar procesos previos
- o cambiar el puerto manualmente

### Prisma da error al arrancar

Revisar:

- que exista `.env`
- que `DATABASE_URL` apunte a SQLite
- haber ejecutado:

```bash
npx prisma generate
npx prisma migrate dev
```

### El frontend no carga en modo unificado

Revisar:

- haber ejecutado `npm run build` en `frontend`
- arrancar backend con `NODE_ENV=production`

## 12. Recomendación para siguientes pasos

Antes de pasar a Raspberry Pi conviene:

- validar este flujo desde cero en otro equipo local
- documentar uso básico de la aplicación
- preparar un script de arranque simplificado para Windows y más adelante para Linux

## 13. Scripts disponibles

### `scripts/install-local.ps1`

- instala dependencias de `backend` y `frontend`
- crea `backend/.env` si no existe
- genera Prisma Client
- aplica migraciones con SQLite

### `scripts/start-local.ps1`

- recompila frontend si no existe `frontend/dist`
- verifica migraciones
- arranca la aplicación unificada en modo local

Opciones útiles:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -RebuildFrontend
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -Port 5050
```

## 14. Documentación operativa recomendada

Para el uso diario y mantenimiento de una instalación local:

- `docs/USO_LOCAL.md`
- `docs/COPIAS_SEGURIDAD.md`
- `docs/ACTUALIZACION_LOCAL.md`