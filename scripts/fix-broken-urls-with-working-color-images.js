const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

// Cache URL check results to avoid repeating requests
const statusCache = new Map()

function checkUrlStatus(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com')) {
    return Promise.resolve(false)
  }
  if (statusCache.has(url)) return Promise.resolve(statusCache.get(url))

  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 7000 }, (res) => {
      const isWorking = res.statusCode === 200
      statusCache.set(url, isWorking)
      resolve(isWorking)
    })
    req.on('error', () => { statusCache.set(url, false); resolve(false) })
    req.on('timeout', () => { req.destroy(); statusCache.set(url, false); resolve(false) })
  })
}

function getColor(attributes) {
  if (!attributes || typeof attributes !== 'object') return null
  return attributes.Farbe || attributes.color || attributes.Color || attributes.farbe || attributes.COLOUR || attributes.Colour || null
}

async function main() {
  console.log('⚡ FAST CONCURRENT HTTP AUDIT AND BROKEN URL PURGE...\n')

  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  // 1. Gather all unique URLs to test across all products & variants
  const allUrls = new Set()
  products.forEach(p => {
    (p.images || []).forEach(img => allUrls.add(img))
    p.variants.forEach(v => (v.images || []).forEach(img => allUrls.add(img)))
  })

  console.log(`🔍 Total Unique Image URLs to verify: ${allUrls.size}`)

  // Batch verify in chunks of 25
  const urlList = Array.from(allUrls)
  const chunkSize = 25
  let verifiedCount = 0

  for (let i = 0; i < urlList.length; i += chunkSize) {
    const chunk = urlList.slice(i, i + chunkSize)
    await Promise.all(chunk.map(url => checkUrlStatus(url)))
    verifiedCount += chunk.length
    console.log(`   Verified ${verifiedCount}/${urlList.size} URLs...`)
  }

  let totalVariantsUpdated = 0

  for (const product of products) {
    // 2. Gather working images for each color of this product
    const workingImagesByColor = new Map()
    const workingProductMainImages = (product.images || []).filter(img => statusCache.get(img) === true)

    for (const variant of product.variants) {
      const color = getColor(variant.attributes)
      if (!color) continue

      const validImgs = (variant.images || []).filter(img => statusCache.get(img) === true)
      if (validImgs.length > 0) {
        if (!workingImagesByColor.has(color)) workingImagesByColor.set(color, [])
        validImgs.forEach(img => {
          if (!workingImagesByColor.get(color).includes(img)) {
            workingImagesByColor.get(color).push(img)
          }
        })
      }
    }

    // 3. For variants that have broken images (statusCache = false), replace with working color/product images
    for (const variant of product.variants) {
      const color = getColor(variant.attributes)
      const currentImages = variant.images || []

      // Filter only working HTTP 200 images
      let newImages = currentImages.filter(img => statusCache.get(img) === true)

      // If variant has no working images, try replacing with working color images
      if (newImages.length === 0 && color && workingImagesByColor.has(color) && workingImagesByColor.get(color).length > 0) {
        newImages = workingImagesByColor.get(color)
      }
      // Fallback to working product images
      else if (newImages.length === 0 && workingProductMainImages.length > 0) {
        newImages = workingProductMainImages
      }

      if (JSON.stringify(newImages) !== JSON.stringify(currentImages)) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { images: newImages },
        })
        totalVariantsUpdated++
      }
    }
  }

  console.log('\n======================================================')
  console.log('🎉 FAST CONCURRENT AUDIT AND PURGE COMPLETE!')
  console.log(`   - Total Product Variants Updated & Fixed: ${totalVariantsUpdated}`)
  console.log('======================================================\n')
}

main().catch(console.error).finally(() => prisma.$disconnect())
