const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUnlinked() {
  const unlinked = await prisma.productVariant.findMany({
    where: { blankGarmentId: null, isActive: true },
    take: 5
  })
  console.log('Unlinked variants sample count:', unlinked.length)
  await prisma.$disconnect()
}

testUnlinked().catch(console.error)
