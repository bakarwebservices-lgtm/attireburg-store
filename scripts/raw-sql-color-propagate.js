const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('⚡ RUNNING INSTANT RAW SQL COLOR IMAGE PROPAGATION...')

  // 1. Match on attributes->>'Farbe'
  const updated1 = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant" v1
    SET images = v2.images
    FROM "ProductVariant" v2
    WHERE v1."productId" = v2."productId"
      AND LOWER(v1.attributes->>'Farbe') = LOWER(v2.attributes->>'Farbe')
      AND (cardinality(v1.images) = 0 OR v1.images IS NULL)
      AND cardinality(v2.images) > 0;
  `)
  console.log(`✅ Updated ${updated1} variants matching 'Farbe'`)

  // 2. Match on attributes->>'color'
  const updated2 = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant" v1
    SET images = v2.images
    FROM "ProductVariant" v2
    WHERE v1."productId" = v2."productId"
      AND LOWER(v1.attributes->>'color') = LOWER(v2.attributes->>'color')
      AND (cardinality(v1.images) = 0 OR v1.images IS NULL)
      AND cardinality(v2.images) > 0;
  `)
  console.log(`✅ Updated ${updated2} variants matching 'color'`)

  // 3. Match on attributes->>'Color'
  const updated3 = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant" v1
    SET images = v2.images
    FROM "ProductVariant" v2
    WHERE v1."productId" = v2."productId"
      AND LOWER(v1.attributes->>'Color') = LOWER(v2.attributes->>'Color')
      AND (cardinality(v1.images) = 0 OR v1.images IS NULL)
      AND cardinality(v2.images) > 0;
  `)
  console.log(`✅ Updated ${updated3} variants matching 'Color'`)

  // 4. Inherit main product images if variant is still empty
  const updated4 = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant" v
    SET images = p.images
    FROM "Product" p
    WHERE v."productId" = p.id
      AND (cardinality(v.images) = 0 OR v.images IS NULL)
      AND cardinality(p.images) > 0;
  `)
  console.log(`✅ Updated ${updated4} variants inheriting main product images`)

  console.log('\n🎉 INSTANT RAW SQL PROPAGATION FINISHED!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
