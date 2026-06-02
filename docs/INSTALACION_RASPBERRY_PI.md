# Instalación de SmartRehabBar en Raspberry Pi 4

Esta guía describe la instalación desde una Raspberry Pi 4 sin configurar, usando Wi-Fi y SSH desde un portátil.

## 1. Recomendación de sistema

Para usar SmartRehabBar desde un entorno gráfico X y abrir la aplicación sin terminal, instala **Raspberry Pi OS with desktop (64-bit)**.

> Si eliges **Lite**, podrás usarla por SSH, pero no tendrás escritorio gráfico para lanzar la app desde X.

## 2. Preparar la microSD

Con **Raspberry Pi Imager**:

1. Selecciona `Raspberry Pi OS with desktop (64-bit)`
2. Abre las opciones avanzadas
3. Configura:
   - hostname, por ejemplo `smartrehabbar`
   - usuario y contraseña
   - Wi-Fi (SSID, contraseña, país)
   - **Enable SSH**
   - zona horaria
4. Graba la microSD

## 3. Primer arranque y acceso por SSH

1. Inserta la microSD y enciende la Raspberry
2. Espera 1-2 minutos a que arranque y se conecte al Wi-Fi
3. Desde el portátil, conecta por SSH:

```bash
ssh usuario@smartrehabbar.local
```

Si no resuelve `.local`, usa la IP del router:

```bash
ssh usuario@192.168.x.x
```

## 4. Copiar el proyecto a la Raspberry

Desde el portátil, en la raíz del proyecto:

```bash
tar --exclude=".git" --exclude="backend/node_modules" --exclude="frontend/node_modules" --exclude="frontend/dist" -czf SmartRehabBar-rpi.tgz .
scp SmartRehabBar-rpi.tgz usuario@IP_RASPBERRY:~/
```

En la Raspberry:

```bash
rm -rf ~/SmartRehabBar-App
mkdir -p ~/SmartRehabBar-App
tar -xzf ~/SmartRehabBar-rpi.tgz -C ~/SmartRehabBar-App
cd ~/SmartRehabBar-App
```

## 5. Instalación automática recomendada

Desde SSH, dentro del proyecto:

```bash
chmod +x scripts/*.sh
./scripts/install-rpi.sh
```

Este script instala paquetes base, Node.js 20 si falta, crea `backend/.env`, prepara SQLite, ejecuta Prisma, instala backend y frontend y compila el frontend.

## 6. Arranque manual sin escritorio gráfico

Si quieres probar por SSH antes de usar X:

```bash
cd ~/SmartRehabBar-App/backend
NODE_ENV=production PORT=5000 node src/server.js
```

Luego abre desde el portátil: `http://IP_RASPBERRY:5000`

## 7. Prueba de Bipedestación con simulador

En otra sesión SSH:

```bash
cd ~/SmartRehabBar-App/backend
npm run simulate:bipedestation
```

## 8. Ejecución desde entorno gráfico X

### 8.1 Crear acceso directo en el escritorio

Con la Raspberry arrancada en modo escritorio:

```bash
cd ~/SmartRehabBar-App
chmod +x scripts/*.sh
./scripts/create-rpi-desktop-launcher.sh
```

Esto crea un acceso directo en el escritorio que arranca backend en segundo plano y abre el navegador apuntando a `http://localhost:5000`.

### 8.2 Lanzar la app sin terminal

Desde el escritorio de la Raspberry, hacer doble clic en `smartrehabbar.desktop`

O desde terminal gráfica:

```bash
~/SmartRehabBar-App/scripts/launch-rpi-gui.sh
```

Modo kiosco/pantalla completa:

```bash
~/SmartRehabBar-App/scripts/launch-rpi-gui.sh --kiosk
```

## 9. Arranque automático con el escritorio

Si quieres que se abra sola al iniciar sesión gráfica:

```bash
cd ~/SmartRehabBar-App
./scripts/create-rpi-desktop-launcher.sh --autostart
```

Esto crea el archivo de autostart en:

- `~/.config/autostart/smartrehabbar.desktop`

## 10. Archivos importantes

- `backend/.env`
- `backend/data/smartrehabbar.db`
- `frontend/dist/`
- `scripts/install-rpi.sh`
- `scripts/launch-rpi-gui.sh`
- `scripts/create-rpi-desktop-launcher.sh`

## 11. Notas prácticas

- la primera instalación puede tardar bastante en Raspberry
- si `npm ci` falla en frontend, usa `npm install --no-fund`
- para un uso táctil real, conviene conectar un monitor a la Raspberry más adelante
- si el puerto 5000 está ocupado, cambia `PORT` en `backend/.env`
