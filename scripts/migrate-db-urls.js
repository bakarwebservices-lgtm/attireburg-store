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
  console.log('🔄 Replacing ALL Supabase project URLs (including older project IDs) with Cloudinary...')

  // 1. Update Product images via REGEXP_REPLACE for any *.supabase.co domain
  const updatedProductsCount = await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET images = ARRAY(
      SELECT REGEXP_REPLACE(img, 'https://[a-zA-Z0-9_-]+\\.supabase\\.co/storage/v1/object/public/product-images/', '${CLOUDINARY_PREFIX}', 'g')
      FROM unnest(images) AS img
    )
    WHERE cardinality(images) > 0;
  `)
  console.log(`📦 Processed Products: ${updatedProductsCount} rows`)

  // 2. Update ProductVariant images via REGEXP_REPLACE
  const updatedVariantsCount = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant"
    SET images = ARRAY(
      SELECT REGEXP_REPLACE(img, 'https://[a-zA-Z0-9_-]+\\.supabase\\.co/storage/v1/object/public/product-images/', '${CLOUDINARY_PREFIX}', 'g')
      FROM unnest(images) AS img
    )
    WHERE cardinality(images) > 0;
  `)
  console.log(`🎨 Processed Product Variants: ${updatedVariantsCount} rows`)

  // 3. Update Category image
  await prisma.$executeRawUnsafe(`
    UPDATE "Category"
    SET image = REGEXP_REPLACE(image, 'https://[a-zA-Z0-9_-]+\\.supabase\\.co/storage/v1/object/public/product-images/', '${CLOUDINARY_PREFIX}', 'g')
    WHERE image LIKE '%supabase.co%';
  `)

  // 4. Update SiteSettings logoUrl
  await prisma.$executeRawUnsafe(`
    UPDATE "SiteSettings"
    SET "logoUrl" = REGEXP_REPLACE("logoUrl", 'https://[a-zA-Z0-9_-]+\\.supabase\\.co/storage/v1/object/public/product-images/', '${CLOUDINARY_PREFIX}', 'g')
    WHERE "logoUrl" LIKE '%supabase.co%';
  `)

  // Verification check
  const products = await prisma.product.findMany({ select: { images: true } })
  const variants = await prisma.productVariant.findMany({ select: { images: true } })

  let remainingSupabase = 0
  let totalCloudinary = 0
  const urlsToWarm = new Set()

  products.forEach(p => p.images.forEach(img => {
    if (img.includes('supabase.co')) remainingSupabase++
    if (img.includes('cloudinary.com')) { totalCloudinary++; urlsToWarm.add(img) }
  }))

  variants.forEach(v => v.images.forEach(img => {
    if (img.includes('supabase.co')) remainingSupabase++
    if (img.includes('cloudinary.com')) { totalCloudinary++; urlsToWarm.add(img) }
  }))

  console.log('\n📊 FINAL VERIFICATION RESULT:')
  console.log(`   - Total Cloudinary Image URLs: ${totalCloudinary}`)
  console.log(`   - Total Supabase URLs Remaining: ${remainingSupabase}`)

  if (remainingSupabase === 0) {
    console.log('\n🎉 SUCCESS! 100% OF ALL DATABASE IMAGE URLS NOW POINT TO CLOUDINARY!')
  } else {
    console.log('\n⚠️ Remaining Supabase URLs list:')
    products.forEach(p => p.images.forEach(img => img.includes('supabase.co') && console.log('  Product:', img)))
    variants.forEach(v => v.images.forEach(img => img.includes('supabase.co') && console.log('  Variant:', img)))
  }

  // Warm newly converted URLs
  if (urlsToWarm.size > 0) {
    console.log(`\n⚡ Warming Cloudinary Cache for ${urlsToWarm.size} image URLs...`)
    let count = 0
    let successCount = 0
    for (const url of urlsToWarm) {
      count++
      const success = await fetchUrl(url)
      if (success) successCount++
    }
    console.log(`🎉 Cloudinary warming finished! (${successCount}/${urlsToWarm.size} cached)`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
