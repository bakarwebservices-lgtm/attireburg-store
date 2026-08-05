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

  console.log('📋 PRODUCT & VARIANT IMAGE AUDIT:\n')

  const itemsNeedingPhotos = []

  for (const product of products) {
    const colorMap = new Map()

    for (const variant of product.variants) {
      const color = variant.attributes?.Farbe || variant.attributes?.color || variant.attributes?.Color || 'Standard'
      if (!colorMap.has(color)) {
        colorMap.set(color, [])
      }
      colorMap.get(color).push(variant)
    }

    const colorsNeedingImages = []
    colorMap.forEach((vars, color) => {
      const hasWorkingImages = vars.some(v => v.images && v.images.length > 0 && v.images.some(img => img.startsWith('http')))
      if (!hasWorkingImages) {
        colorsNeedingImages.push(color)
      }
    })

    if (colorsNeedingImages.length > 0 || !product.images || product.images.length === 0) {
      itemsNeedingPhotos.push({
        name: product.name,
        category: product.category,
        colors: colorsNeedingImages,
      })
    }
  }

  console.log('===================================================')
  console.log(`FOUND ${itemsNeedingPhotos.length} PRODUCTS THAT NEED PHOTOS:`)
  console.log('===================================================\n')

  itemsNeedingPhotos.forEach((item, idx) => {
    console.log(`${idx + 1}. "${item.name}" (Kategorie: ${item.category})`)
    if (item.colors.length > 0) {
      console.log(`   🎨 Farben ohne Bilder: [ ${item.colors.join(', ')} ]`)
    }
    console.log('')
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
