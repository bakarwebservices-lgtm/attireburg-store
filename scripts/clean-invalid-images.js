const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('⚡ Running instant raw SQL database cleanup for invalid base64 images...')

  const updatedProducts = await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET images = ARRAY(
      SELECT img FROM unnest(images) AS img WHERE img LIKE 'http%'
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS img WHERE img NOT LIKE 'http%'
    );
  `)
  console.log(`📦 Cleaned Products: ${updatedProducts} rows updated`)

  const updatedVariants = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant"
    SET images = ARRAY(
      SELECT img FROM unnest(images) AS img WHERE img LIKE 'http%'
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS img WHERE img NOT LIKE 'http%'
    );
  `)
  console.log(`🎨 Cleaned Product Variants: ${updatedVariants} rows updated`)

  console.log('\n🎉 ALL BASE64 / MALFORMED STRINGS REMOVED FROM DATABASE!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
