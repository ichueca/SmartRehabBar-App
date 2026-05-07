# Copias de seguridad de SmartRehabBar

Esta guía describe cómo guardar y restaurar la instalación local, especialmente la base de datos SQLite.

## 1. Qué hay que guardar

El archivo más importante es:

- `backend/data/smartrehabbar.db`

Opcionalmente también conviene guardar:

- `backend/.env`
- documentación o archivos auxiliares del centro

## 2. Cuándo hacer copia

Se recomienda hacer copia:

- antes de actualizar la aplicación
- después de sesiones importantes
- periódicamente (por ejemplo, semanalmente)
- antes de mover la instalación a otro equipo

## 3. Copia de seguridad manual

### Paso 1: cerrar la aplicación

Antes de copiar la base de datos:

- detener SmartRehabBar con `Ctrl + C`
- asegurarse de que el servidor ya no está escribiendo en la BD

### Paso 2: copiar el archivo

Copiar:

- `backend/data/smartrehabbar.db`

A una ubicación segura, por ejemplo:

- carpeta de red del centro
- memoria USB cifrada
- carpeta de copias del equipo

## 4. Ejemplo en Windows

```powershell
Copy-Item .\backend\data\smartrehabbar.db .\backup\smartrehabbar_$(Get-Date -Format yyyy-MM-dd).db
```

## 5. Restaurar una copia

### Paso 1: cerrar la aplicación

Detener SmartRehabBar antes de restaurar.

### Paso 2: sustituir la base de datos actual

Copiar la copia guardada sobre:

- `backend/data/smartrehabbar.db`

Ejemplo:

```powershell
Copy-Item .\backup\smartrehabbar_2026-05-06.db .\backend\data\smartrehabbar.db -Force
```

### Paso 3: volver a iniciar la aplicación

- `Iniciar SmartRehabBar.bat`

## 6. Recomendaciones

- no sobrescribir la única copia existente
- usar nombres con fecha
- conservar varias copias históricas
- verificar de vez en cuando que una copia abre correctamente

## 7. Qué no es necesario copiar siempre

No suele hacer falta incluir en cada copia:

- `node_modules`
- `frontend/dist`

Esos elementos se pueden regenerar a partir del repositorio.

## 8. Estrategia recomendada

Mínimo recomendado:

- copia semanal de `smartrehabbar.db`
- copia adicional antes de cualquier actualización
- copia extraordinaria antes de migrar a Raspberry Pi o a otro equipo
