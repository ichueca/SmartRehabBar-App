#!/bin/sh

echo "🚀 Iniciando SmartRehabBar..."

# Ejecutar migraciones
echo "📦 Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Error al ejecutar migraciones"
  exit 1
fi

# Ejecutar seed
echo "🌱 Ejecutando seed de datos iniciales..."
node prisma/seed.js

if [ $? -ne 0 ]; then
  echo "⚠️  Advertencia: Error al ejecutar seed (continuando de todas formas)"
fi

# Iniciar servidor
echo "✅ Iniciando servidor..."
node src/server.js

