const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  console.log('🔍 INSPECTING PRODUCTS WITH MIXED VARIANT IMAGES:\n')

  for (const p of products) {
    const colorGroup = new Map()

    for (const v of p.variants) {
      const color = v.attributes?.Farbe || v.attributes?.color || v.attributes?.Color || 'Unspecified'
      if (!colorGroup.has(color)) colorGroup.set(color, [])
      colorGroup.get(color).push(v)
    }

    colorGroup.forEach((variants, color) => {
      const withImages = variants.filter(v => v.images && v.images.length > 0 && v.images.some(i => i.startsWith('http')))
      const withoutImages = variants.filter(v => !v.images || v.images.length === 0 || !v.images.some(i => i.startsWith('http')))

      if (withImages.length > 0 && withoutImages.length > 0) {
        console.log(`⚠️ Product "${p.name}" (${p.id}):`)
        console.log(`   Color "${color}": ${withImages.length} variants HAVE images, but ${withoutImages.length} variants DO NOT!`)
        console.log(`   Sample with image: SKU ${withImages[0].sku} -> ${withImages[0].images[0]}`)
        console.log(`   Sample WITHOUT image: SKU ${withoutImages[0].sku} (Attributes: ${JSON.stringify(withoutImages[0].attributes)})`)
        console.log('---')
      }
    })
  }
}

main().finally(() => prisma.$disconnect())
