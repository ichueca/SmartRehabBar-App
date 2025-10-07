import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seeds...')
  
  await prisma.measurement.deleteMany()
  await prisma.session.deleteMany()
  await prisma.patient.deleteMany()
  
  const patient1 = await prisma.patient.create({
    data: { name: 'Juan Pérez' }
  })
  
  const patient2 = await prisma.patient.create({
    data: { name: 'María García' }
  })
  
  console.log('Pacientes creados:', patient1.name, patient2.name)
  console.log('Seeds completados!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
