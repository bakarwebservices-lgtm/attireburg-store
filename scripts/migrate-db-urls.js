const { PrismaClient } = require('@prisma/client')
const https = require('https')
const http = require('http')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

const SUPABASE_PREFIX = 'https://httejhqpiwcpbljvnqfv.supabase.co/storage/v1/object/public/product-images/'
const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/dp1vaoeb/image/upload/product-images/'

function fetchUrl(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http
      const req = client.get(url, { timeout: 15000 }, (res) => {
        res.on('data', () => {})
        res.on('end', () => resolve(res.statusCode === 200 || res.statusCode === 304))
      })
      req.on('error', () => resolve(false))
      req.on('timeout', () => { req.destroy(); resolve(false) })
    } catch (e) {
      resolve(false)
    }
  })
}

async function main() {
  console.log('🔄 Starting high-performance SQL database URL migration...')

  // 1. Update Product images via raw SQL array replace
  const updatedProductsCount = await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET images = ARRAY(
      SELECT REPLACE(img, '${SUPABASE_PREFIX}', '${CLOUDINARY_PREFIX}')
      FROM unnest(images) AS img
    )
    WHERE cardinality(images) > 0;
  `)
  console.log(`📦 Updated Products: ${updatedProductsCount} rows processed`)

  // 2. Update ProductVariant images via raw SQL array replace
  const updatedVariantsCount = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant"
    SET images = ARRAY(
      SELECT REPLACE(img, '${SUPABASE_PREFIX}', '${CLOUDINARY_PREFIX}')
      FROM unnest(images) AS img
    )
    WHERE cardinality(images) > 0;
  `)
  console.log(`🎨 Updated Product Variants: ${updatedVariantsCount} rows processed`)

  // 3. Update Category image
  const updatedCategoriesCount = await prisma.$executeRawUnsafe(`
    UPDATE "Category"
    SET image = REPLACE(image, '${SUPABASE_PREFIX}', '${CLOUDINARY_PREFIX}')
    WHERE image LIKE '${SUPABASE_PREFIX}%';
  `)
  console.log(`🏷️ Updated Categories: ${updatedCategoriesCount} rows processed`)

  // 4. Update SiteSettings logoUrl
  const updatedSettingsCount = await prisma.$executeRawUnsafe(`
    UPDATE "SiteSettings"
    SET "logoUrl" = REPLACE("logoUrl", '${SUPABASE_PREFIX}', '${CLOUDINARY_PREFIX}')
    WHERE "logoUrl" LIKE '${SUPABASE_PREFIX}%';
  `)
  console.log(`⚙️ Updated SiteSettings Logo: ${updatedSettingsCount} rows processed`)

  // Gather unique Cloudinary image URLs to warm
  const products = await prisma.product.findMany({ select: { images: true } })
  const variants = await prisma.productVariant.findMany({ select: { images: true } })

  const urlsToWarm = new Set()
  products.forEach(p => p.images.forEach(img => img.startsWith(CLOUDINARY_PREFIX) && urlsToWarm.add(img)))
  variants.forEach(v => v.images.forEach(img => img.startsWith(CLOUDINARY_PREFIX) && urlsToWarm.add(img)))

  console.log(`\n⚡ Unique Cloudinary Image URLs found: ${urlsToWarm.size}`)

  if (urlsToWarm.size > 0) {
    console.log('⚡ Warming Cloudinary Cache (triggering auto-upload for all existing images)...')
    let count = 0
    let successCount = 0
    for (const url of urlsToWarm) {
      count++
      const success = await fetchUrl(url)
      if (success) successCount++
      console.log(`   [${count}/${urlsToWarm.size}] ${success ? '✅ Cached' : '⚠️ HTTP error'} ${url}`)
    }
    console.log(`\n🎉 Cloudinary warming complete! (${successCount}/${urlsToWarm.size} images successfully cached)`)
  }
}

main()
  .catch((err) => {
    console.error('❌ Error during database migration:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
