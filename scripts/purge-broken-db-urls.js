const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

const BROKEN_FILENAMES = [
  '1779274389627.jpg', '1779274387239.avif', '1779274384958.jpg',
  '1779274388612.jpg', '1779274388041.avif', '1779274386317.jpg',
  '1779368650686.jpg', '1781957636312.jpg', '1782569638053.jpeg'
]

async function main() {
  console.log('⚡ PURGING KNOWN BROKEN URLS FROM DATABASE PRODUCTS AND VARIANTS...')

  for (const filename of BROKEN_FILENAMES) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Product"
      SET images = ARRAY(
        SELECT img FROM unnest(images) AS img WHERE img NOT LIKE '%${filename}%'
      )
      WHERE EXISTS (
        SELECT 1 FROM unnest(images) AS img WHERE img LIKE '%${filename}%'
      );
    `)

    await prisma.$executeRawUnsafe(`
      UPDATE "ProductVariant"
      SET images = ARRAY(
        SELECT img FROM unnest(images) AS img WHERE img NOT LIKE '%${filename}%'
      )
      WHERE EXISTS (
        SELECT 1 FROM unnest(images) AS img WHERE img LIKE '%${filename}%'
      );
    `)
  }

  console.log('✅ BROKEN URLS PURGED FROM DATABASE!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
