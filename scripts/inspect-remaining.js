const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, images: true } })
  const variants = await prisma.productVariant.findMany({ select: { id: true, images: true } })

  console.log('--- SAMPLE REMAINING PRODUCT SUPABASE URLS ---')
  for (const p of products) {
    for (const img of p.images) {
      if (img.includes('supabase.co')) {
        console.log('Product img:', img)
      }
    }
  }

  console.log('\n--- SAMPLE REMAINING VARIANT SUPABASE URLS (first 10) ---')
  let count = 0
  for (const v of variants) {
    for (const img of v.images) {
      if (img.includes('supabase.co')) {
        console.log('Variant img:', img)
        count++
        if (count >= 10) break
      }
    }
    if (count >= 10) break
  }
}

main().finally(() => prisma.$disconnect())
