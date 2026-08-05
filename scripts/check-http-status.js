const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode)
    }).on('error', () => resolve(500))
  })
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } })
  const variants = await prisma.productVariant.findMany({ select: { id: true, sku: true, images: true } })

  console.log('🔍 Checking HTTP status of Cloudinary URLs...\n')

  let status200 = 0
  let status400 = 0
  let status404 = 0

  const badProducts = []

  for (const p of products) {
    for (const img of p.images) {
      const code = await checkUrl(img)
      if (code === 200) status200++
      else {
        if (code === 400) status400++
        else status404++
        badProducts.push({ name: p.name, url: img, code })
      }
    }
  }

  console.log(`HTTP 200 (Working Images): ${status200}`)
  console.log(`HTTP 400/404 (Missing/Deleted Images): ${status400 + status404}`)

  if (badProducts.length > 0) {
    console.log('\nSample Broken Images:')
    badProducts.slice(0, 10).forEach(b => console.log(`  [${b.code}] ${b.name} -> ${b.url}`))
  }
}

main().finally(() => prisma.$disconnect())
