const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const COLOR_MAP = {
  'schwarz': 'black', 'black': 'black', 'kaala': 'black', 'near black': 'black',
  'weiß': 'white', 'white': 'white', 'chitti': 'white',
  'blau': 'blue', 'blue': 'blue', 'neela': 'blue', 'neeli': 'blue', 'navy': 'blue',
  'rot': 'red', 'red': 'red', 'laal': 'red', 'tuscan red': 'red',
  'coral': 'coral', 'warm beige': 'beige', 'beige': 'beige', 'gulabi': 'pink', 'pink': 'pink',
}

function normalizeColor(attributes) {
  if (!attributes || typeof attributes !== 'object') return null
  const raw = attributes.Farbe || attributes.color || attributes.Color || attributes.farbe || attributes.COLOUR || attributes.Colour || null
  if (!raw || typeof raw !== 'string') return null
  const lower = raw.trim().toLowerCase()
  return COLOR_MAP[lower] || lower
}

async function main() {
  console.log('🚀 RUNNING ADVANCED COLOR SYNONYM PROPAGATION...\n')

  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  let totalVariantsUpdated = 0
  let totalProductsUpdated = 0

  for (const product of products) {
    const colorToImages = new Map()
    const validProductImages = (product.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))

    // 1. Gather all working images by normalized color
    for (const variant of product.variants) {
      const normColor = normalizeColor(variant.attributes)
      if (!normColor) continue

      const validImgs = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))
      if (validImgs.length > 0) {
        if (!colorToImages.has(normColor)) colorToImages.set(normColor, [])
        validImgs.forEach(img => {
          if (!colorToImages.get(normColor).includes(img)) {
            colorToImages.get(normColor).push(img)
          }
        })
      }
    }

    // 2. Propagate to ALL variants matching normalized color OR product fallback
    let productVariantsUpdated = 0

    for (const variant of product.variants) {
      const normColor = normalizeColor(variant.attributes)
      const currentValidImgs = (variant.images || []).filter(img => img && img.startsWith('https://res.cloudinary.com'))

      if (currentValidImgs.length === 0) {
        let targetImages = []

        if (normColor && colorToImages.has(normColor) && colorToImages.get(normColor).length > 0) {
          targetImages = colorToImages.get(normColor)
        } else if (validProductImages.length > 0) {
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
      console.log(`✅ Product "${product.name}": Updated ${productVariantsUpdated} variants`)
    }
  }

  console.log('\n======================================================')
  console.log(`🎉 SYNONYM PROPAGATION COMPLETE!`)
  console.log(`   - Total Product Variants Updated: ${totalVariantsUpdated}`)
  console.log('======================================================')
}

main().catch(console.error).finally(() => prisma.$disconnect())
