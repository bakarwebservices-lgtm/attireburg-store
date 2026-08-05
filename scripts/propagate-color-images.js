const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

function getColor(attributes) {
  if (!attributes || typeof attributes !== 'object') return null
  return attributes.Farbe || attributes.color || attributes.Color || attributes.farbe || attributes.COLOUR || attributes.Colour || null
}

async function main() {
  console.log('🚀 RUNNING AUTOMATED COLOR IMAGE PROPAGATION SCRIPT...\n')

  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  let totalVariantsUpdated = 0
  let totalProductsUpdated = 0

  for (const product of products) {
    // 1. Gather all working image URLs for each color of this product
    const colorToImagesMap = new Map()
    const validProductImages = (product.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))

    for (const variant of product.variants) {
      const color = getColor(variant.attributes)
      if (!color) continue

      const validVariantImages = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))

      if (validVariantImages.length > 0) {
        if (!colorToImagesMap.has(color)) colorToImagesMap.set(color, [])
        validVariantImages.forEach(img => {
          if (!colorToImagesMap.get(color).includes(img)) {
            colorToImagesMap.get(color).push(img)
          }
        })
      }
    }

    // 2. Propagate images to empty variants
    let productVariantsUpdated = 0

    for (const variant of product.variants) {
      const color = getColor(variant.attributes)
      const currentValidImages = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))

      if (currentValidImages.length === 0) {
        let targetImages = []

        // First choice: use images from another variant of the SAME color
        if (color && colorToImagesMap.has(color) && colorToImagesMap.get(color).length > 0) {
          targetImages = colorToImagesMap.get(color)
        }
        // Second choice: use product's main working images
        else if (validProductImages.length > 0) {
          targetImages = validProductImages
        }

        if (targetImages.length > 0) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { images: targetImages },
          })
          productVariantsUpdated++
          totalVariantsUpdated++
        }
      }
    }

    if (productVariantsUpdated > 0) {
      totalProductsUpdated++
      console.log(`✅ Product "${product.name}": Updated ${productVariantsUpdated} variants with matching color/product images`)
    }
  }

  console.log('\n======================================================')
  console.log('🎉 AUTOMATED PROPAGATION COMPLETE!')
  console.log(`   - Products updated: ${totalProductsUpdated}`)
  console.log(`   - Total Product Variants updated: ${totalVariantsUpdated}`)
  console.log('======================================================\n')

  // Re-run final audit report to see remaining missing items
  console.log('📋 FINAL POST-PROPAGATION AUDIT REPORT:')
  console.log('------------------------------------------------------')
  
  const updatedProducts = await prisma.product.findMany({
    include: { variants: true },
  })

  let remainingMissingProducts = 0

  for (const product of updatedProducts) {
    const missingColors = new Set()
    for (const variant of product.variants) {
      const validImgs = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))
      if (validImgs.length === 0) {
        const color = getColor(variant.attributes) || 'Default'
        missingColors.add(color)
      }
    }

    if (missingColors.size > 0) {
      remainingMissingProducts++
      console.log(`• "${product.name}": Missing images for [ ${Array.from(missingColors).join(', ')} ]`)
    }
  }

  if (remainingMissingProducts === 0) {
    console.log('🎉 ALL PRODUCTS AND VARIANTS ARE 100% POPULATED WITH WORKING IMAGES!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
