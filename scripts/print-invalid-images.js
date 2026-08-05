const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const products = await prisma.product.findMany()
  const variants = await prisma.productVariant.findMany()

  console.log('--- INVALID IMAGE STRINGS SAMPLE ---')
  for (const p of products) {
    p.images.forEach(img => {
      if (!img || img.trim() === '' || !img.startsWith('http')) {
        console.log(`Product "${p.name}" (${p.id}): "${img}"`)
      }
    })
  }

  for (const v of variants) {
    v.images.forEach(img => {
      if (!img || img.trim() === '' || !img.startsWith('http')) {
        console.log(`Variant ${v.sku} (${v.id}): "${img}"`)
      }
    })
  }
}

main().finally(() => prisma.$disconnect())
