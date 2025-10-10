# Dockerfile para SmartRehabBar - Despliegue en Heroku
# Incluye backend + frontend + SQLite

FROM node:18-alpine

# Instalar dependencias del sistema (SQLite ya viene incluido en Alpine)
RUN apk add --no-cache sqlite

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependencias del backend
WORKDIR /app/backend
RUN npm install --omit=dev

# Instalar dependencias del frontend
WORKDIR /app/frontend
RUN npm install

# Copiar código fuente
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Generar Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# Build del frontend
WORKDIR /app/frontend
RUN npm run build

# Mover build del frontend al backend para servirlo
RUN mv dist /app/backend/public

# Volver al directorio del backend
WORKDIR /app/backend

# Crear directorio para la base de datos
RUN mkdir -p /app/backend/data

# Dar permisos de ejecución al script de inicio
RUN chmod +x start.sh

# Exponer puerto
EXPOSE $PORT

# Script de inicio: ejecutar migraciones, seed y arrancar servidor
CMD ["sh", "start.sh"]

