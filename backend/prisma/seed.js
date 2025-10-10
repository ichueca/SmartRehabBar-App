import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Verificar si ya existen pacientes
  const existingPatients = await prisma.patient.count()
  
  if (existingPatients > 0) {
    console.log(`✅ Ya existen ${existingPatients} pacientes en la base de datos. Saltando seed.`)
    return
  }

  // Crear pacientes de prueba
  const patients = [
    {
      name: 'Juan Pérez García',
    },
    {
      name: 'María López Fernández',
    },
    {
      name: 'Carlos Rodríguez Martín',
    },
    {
      name: 'Ana Sánchez Torres',
    },
    {
      name: 'Pedro Gómez Ruiz',
    }
  ]

  console.log('📝 Creando pacientes de prueba...')
  
  for (const patientData of patients) {
    const patient = await prisma.patient.create({
      data: patientData
    })
    console.log(`   ✓ Paciente creado: ${patient.name} (ID: ${patient.id})`)
  }

  console.log('✅ Seed completado exitosamente!')
  console.log(`   Total de pacientes creados: ${patients.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

