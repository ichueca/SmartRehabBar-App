# Uso local de SmartRehabBar

Esta guía explica el uso diario de SmartRehabBar en una instalación local de centro.

## 1. Arranque de la aplicación

### Opción recomendada en Windows

Desde la raíz del proyecto, hacer doble clic en:

- `Iniciar SmartRehabBar.bat`

La aplicación quedará disponible en:

- `http://localhost:5000`

### Opción manual

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

## 2. Parada de la aplicación

Para detener la aplicación:

- volver a la ventana donde se ha iniciado
- pulsar `Ctrl + C`

## 3. Flujo básico de uso

### Dashboard

Desde el dashboard se puede acceder a:

- gestión de pacientes
- sesiones de pisadas
- medición de levantarse (`Sit-to-Stand`)
- ejercicio de **Bipedestación**

### Bipedestación

Uso recomendado:

1. abrir Bipedestación
2. seleccionar objetivo (`50/50`, `60/40`, etc.)
3. elegir modo adulto o infantil
4. activar audio si se van a usar auriculares
5. pulsar `Iniciar ejercicio`
6. subir a la plataforma
7. seguir el feedback visual y/o sonoro

### Simulación para pruebas o demostraciones

Desde `backend`:

```powershell
npm run simulate:bipedestation
```

Esto reproduce una secuencia visual útil para demostraciones y validación local.

## 4. Recomendaciones de uso

- usar navegador actualizado
- no abrir varias instancias de la aplicación en distintos puertos sin necesidad
- si se usa audio, preferir auriculares
- no cerrar la ventana del servidor mientras se esté usando la aplicación

## 5. Qué hacer si no carga

### Caso 1: la página no abre

Comprobar:

- que el servidor sigue abierto
- que la URL es `http://localhost:5000`
- que no haya otro proceso usando ese puerto

### Caso 2: la aplicación abre pero no responde

- cerrar la ventana del servidor con `Ctrl + C`
- iniciar de nuevo con `Iniciar SmartRehabBar.bat`

### Caso 3: hay cambios recientes y no se ven

Iniciar de nuevo forzando recompilación del frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -RebuildFrontend
```

## 6. Archivos y carpetas importantes

- `backend/.env` → configuración local
- `backend/data/smartrehabbar.db` → base de datos SQLite
- `frontend/dist` → frontend compilado para modo local unificado

## 7. Documentación relacionada

- `docs/INSTALACION_LOCAL.md`
- `docs/COPIAS_SEGURIDAD.md`
- `docs/ACTUALIZACION_LOCAL.md`
