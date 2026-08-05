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

  console.log('🔍 Checking for empty/blank string images in DB...')
  
  let emptyImgCount = 0

  for (const p of products) {
    p.images.forEach(img => {
      if (!img || img.trim() === '' || !img.startsWith('http')) {
        console.log(`Product ${p.id} ("${p.name}") has invalid image string: "${img}"`)
        emptyImgCount++
      }
    })
  }

  for (const v of variants) {
    v.images.forEach(img => {
      if (!img || img.trim() === '' || !img.startsWith('http')) {
        console.log(`Variant ${v.id} (SKU: ${v.sku}) has invalid image string: "${img}"`)
        emptyImgCount++
      }
    })
  }

  console.log(`Total invalid/empty image strings found in DB: ${emptyImgCount}`)
}

main().finally(() => prisma.$disconnect())
