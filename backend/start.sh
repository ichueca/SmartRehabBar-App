#!/bin/sh

echo "🚀 Iniciando SmartRehabBar..."

# Crear esquema de base de datos
echo "📦 Creando esquema de base de datos..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
  echo "❌ Error al crear esquema"
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

