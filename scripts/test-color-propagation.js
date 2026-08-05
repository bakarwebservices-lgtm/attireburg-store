const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  console.log('🔍 FAST ANALYSIS OF COLOR-BASED IMAGE PROPAGATION POTENTIAL...\n')

  let fixableVariantsCount = 0
  let totalMissingVariants = 0

  for (const product of products) {
    // Map of color -> array of valid Cloudinary image URLs
    const colorImages = new Map()

    // 1. Gather all valid Cloudinary images by color for this product
    for (const variant of product.variants) {
      const color = variant.attributes?.Farbe || variant.attributes?.color || variant.attributes?.Color
      if (!color) continue

      const validImgs = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))
      if (validImgs.length > 0) {
        if (!colorImages.has(color)) colorImages.set(color, [])
        validImgs.forEach(img => {
          if (!colorImages.get(color).includes(img)) {
            colorImages.get(color).push(img)
          }
        })
      }
    }

    // 2. Count variants of this product that are currently empty but can inherit from colorImages
    let productFixes = 0

    for (const variant of product.variants) {
      const color = variant.attributes?.Farbe || variant.attributes?.color || variant.attributes?.Color
      if (!color) continue

      const hasImages = (variant.images || []).some(img => img && img.startsWith('https://res.cloudinary.com'))

      if (!hasImages) {
        totalMissingVariants++
        if (colorImages.has(color) && colorImages.get(color).length > 0) {
          productFixes++
          fixableVariantsCount++
        }
      }
    }

    if (productFixes > 0) {
      const availableColors = Array.from(colorImages.keys())
      console.log(`✨ Product "${product.name}": ${productFixes} variants can be INSTANTLY FIXED using existing color images for [ ${availableColors.join(', ')} ]!`)
    }
  }

  console.log('\n======================================================')
  console.log(`📊 TOTAL PROPAGATION FIX RESULT:`)
  console.log(`   - Total variants missing images: ${totalMissingVariants}`)
  console.log(`   - Variants that can be INSTANTLY FIXED automatically: ${fixableVariantsCount}`)
  console.log('======================================================')
}

main().catch(console.error).finally(() => prisma.$disconnect())
