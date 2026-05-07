# Actualización local de SmartRehabBar

Esta guía describe cómo actualizar una instalación local existente sin perder la base de datos.

## 1. Antes de actualizar

### Recomendado

1. cerrar la aplicación
2. hacer copia de seguridad de la base de datos
3. comprobar que se dispone de la nueva versión del código

Consulta también:

- `docs/COPIAS_SEGURIDAD.md`

## 2. Actualización típica en Windows

### Paso 1: cerrar SmartRehabBar

Si está en marcha:

- ir a la ventana del servidor
- pulsar `Ctrl + C`

### Paso 2: actualizar el código fuente

#### Si se usa Git

```powershell
git pull
```

#### Si se usa ZIP

- descomprimir la nueva versión
- sustituir los archivos del proyecto
- **mantener** la base de datos existente `backend/data/smartrehabbar.db`
- **mantener** el archivo `backend/.env` si ya estaba configurado

### Paso 3: ejecutar el instalador local

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1
```

O haciendo doble clic en:

- `Instalar SmartRehabBar.bat`

Este paso:

- instala dependencias si hace falta
- aplica migraciones pendientes
- mantiene la base de datos actual

### Paso 4: arrancar la aplicación

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -RebuildFrontend
```

O haciendo doble clic en:

- `Iniciar SmartRehabBar.bat`

## 3. Qué revisar después de actualizar

- que la app abre en `http://localhost:5000`
- que el dashboard carga correctamente
- que la base de datos mantiene los datos previos
- que Bipedestación y el resto de pantallas principales funcionan

## 4. Si algo falla

### Opción 1: reintentar instalación

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-local.ps1 -ForceInstall
```

### Opción 2: restaurar la base de datos

Si la actualización ha salido mal y hay que volver atrás:

- restaurar copia de `backend/data/smartrehabbar.db`
- volver a arrancar la app

## 5. Buenas prácticas

- actualizar primero en equipo de pruebas si es posible
- conservar copia de la versión anterior
- no actualizar sin tener copia reciente de la BD
- documentar la fecha de cada actualización
