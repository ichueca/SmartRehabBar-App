# Guía de Despliegue en Heroku con Docker + SQLite

Esta guía te ayudará a desplegar SmartRehabBar en Heroku usando Docker con SQLite (sin necesidad de PostgreSQL).

## Requisitos Previos

1. **Cuenta de Heroku**: Crear una cuenta gratuita en [heroku.com](https://heroku.com)
2. **Heroku CLI**: Instalar desde [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Tener Git instalado y el proyecto en un repositorio

## Paso 1: Instalar Heroku CLI

### Windows (PowerShell como Administrador):
```powershell
winget install Heroku.HerokuCLI
```

O descargar el instalador desde: https://devcenter.heroku.com/articles/heroku-cli

### Verificar instalación:
```bash
heroku --version
```

## Paso 2: Login en Heroku

```bash
heroku login
```

Esto abrirá tu navegador para autenticarte.

## Paso 3: Crear la aplicación en Heroku

```bash
# Crear app (Heroku asignará un nombre único si no especificas uno)
heroku create smartrehabbar-demo

# O dejar que Heroku genere un nombre automático:
heroku create
```

## Paso 4: Configurar Stack de Heroku para Docker

```bash
heroku stack:set container -a smartrehabbar-demo
```

## Paso 5: Configurar Variables de Entorno

**Nota**: No necesitas PostgreSQL, usamos SQLite incluido en el contenedor.

```bash
heroku config:set NODE_ENV=production -a smartrehabbar-demo
heroku config:set CORS_ORIGIN=* -a smartrehabbar-demo
heroku config:set DATABASE_URL=file:./data/smartrehabbar.db -a smartrehabbar-demo
```

## Paso 6: Desplegar

```bash
# Asegurarte de estar en la rama correcta
git status

# Agregar todos los cambios
git add .
git commit -m "Preparar para despliegue en Heroku"

# Desplegar a Heroku
git push heroku master
```

Si tu rama principal se llama `main`:
```bash
git push heroku main
```

## Paso 7: Verificar el Despliegue

```bash
# Ver logs en tiempo real
heroku logs --tail -a smartrehabbar-demo

# Abrir la aplicación en el navegador
heroku open -a smartrehabbar-demo
```

## Paso 8: Ejecutar Migraciones (si es necesario)

Las migraciones se ejecutan automáticamente en el Dockerfile, pero si necesitas ejecutarlas manualmente:

```bash
heroku run npx prisma migrate deploy -a smartrehabbar-demo
```

**Nota sobre SQLite**: Los datos se almacenan en el contenedor. Si Heroku reinicia el dyno (cada ~24h), los datos se perderán. Esto es normal para un prototipo de demostración.

## Comandos Útiles

### Ver estado de la aplicación:
```bash
heroku ps -a smartrehabbar-demo
```

### Ver configuración:
```bash
heroku config -a smartrehabbar-demo
```

### Reiniciar la aplicación:
```bash
heroku restart -a smartrehabbar-demo
```

### Acceder al contenedor:
```bash
heroku run bash -a smartrehabbar-demo
```

### Ver la base de datos SQLite:
```bash
heroku run sqlite3 /app/backend/data/smartrehabbar.db -a smartrehabbar-demo
```

## Solución de Problemas

### Error: "No default language could be detected"
Asegúrate de que `heroku.yml` existe en la raíz del proyecto.

### Error de build de Docker:
```bash
# Ver logs detallados
heroku logs --tail -a smartrehabbar-demo

# Reconstruir
git commit --allow-empty -m "Rebuild"
git push heroku master
```

### La aplicación no inicia:
```bash
# Verificar que el proceso web está corriendo
heroku ps -a smartrehabbar-demo

# Escalar el proceso si es necesario
heroku ps:scale web=1 -a smartrehabbar-demo
```

### Error de base de datos:
```bash
# Verificar que DATABASE_URL está configurada
heroku config:get DATABASE_URL -a smartrehabbar-demo

# Acceder al contenedor y verificar la DB
heroku run ls -la /app/backend/data -a smartrehabbar-demo
```

## URLs de la Aplicación

Después del despliegue, tu aplicación estará disponible en:
- **Frontend**: `https://smartrehabbar-demo.herokuapp.com`
- **API**: `https://smartrehabbar-demo.herokuapp.com/api`
- **Health Check**: `https://smartrehabbar-demo.herokuapp.com/health`

## Actualizar la Aplicación

Para desplegar cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push heroku master
```

## Costos

- **Dyno (servidor)**: Gratis con limitaciones (duerme después de 30 min de inactividad)
- **Base de datos**: Gratis (SQLite incluido en el contenedor)
- **Total**: $0/mes para prototipo

### Upgrade a plan de pago (opcional):
```bash
# Dyno Básico ($7/mes) - no duerme, más estable
heroku ps:type basic -a smartrehabbar-demo
```

## Notas Importantes

1. **El dyno gratuito duerme** después de 30 minutos de inactividad. La primera petición después de dormir tardará ~10-30 segundos.

2. **Límite de horas**: Los dynos gratuitos tienen un límite de 550 horas/mes (verificar cuenta).

3. **Base de datos SQLite**: Los datos se almacenan en el contenedor. **Se perderán cuando Heroku reinicie el dyno** (cada ~24h o al hacer redeploy). Esto es perfecto para un prototipo de demostración donde los usuarios pueden crear datos de prueba cada vez.

4. **Logs**: Los logs gratuitos solo guardan las últimas 1500 líneas.

5. **Para datos persistentes**: Si necesitas que los datos persistan, considera usar el addon de PostgreSQL o esperar al despliegue final en Raspberry Pi.

## Siguiente Paso: Instalación Local (Raspberry Pi)

Una vez validado el prototipo en Heroku, consulta `DEPLOY_LOCAL.md` para instrucciones de instalación en Raspberry Pi o PC local.

