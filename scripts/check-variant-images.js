const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🔍 Checking Variant Images in Database...\n')

  const variants = await prisma.productVariant.findMany({
    select: { id: true, sku: true, productId: true, images: true }
  })

  let emptyVariantImages = 0
  let brokenOrInvalidUrls = 0
  let validCloudinaryUrls = 0
  let totalVariants = variants.length

  const invalidUrls = []

  variants.forEach(v => {
    if (!v.images || v.images.length === 0) {
      emptyVariantImages++
    } else {
      v.images.forEach(img => {
        if (!img || typeof img !== 'string' || img.trim() === '' || (!img.startsWith('http://') && !img.startsWith('https://'))) {
          brokenOrInvalidUrls++
          invalidUrls.push({ variantId: v.id, sku: v.sku, img })
        } else {
          validCloudinaryUrls++
        }
      })
    }
  })

  console.log('📊 VARIANT IMAGE CHECK RESULT:')
  console.log('--------------------------------------------------')
  console.log(`Total Product Variants: ${totalVariants}`)
  console.log(`Variants with Empty images []: ${emptyVariantImages}`)
  console.log(`Valid Image URLs: ${validCloudinaryUrls}`)
  console.log(`Invalid / Broken Image Entries: ${brokenOrInvalidUrls}`)
  console.log('--------------------------------------------------')

  if (invalidUrls.length > 0) {
    console.log('\n⚠️ Samples of invalid entries:')
    invalidUrls.slice(0, 10).forEach(x => console.log(`  SKU: ${x.sku} -> "${x.img}"`))
  }
}

main().finally(() => prisma.$disconnect())
