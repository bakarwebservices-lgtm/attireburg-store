const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode })
    }).on('error', (err) => resolve({ url, status: 'ERROR', error: err.message }))
  })
}

async function main() {
  const products = await prisma.product.findMany({ take: 5 })
  console.log('🔍 Testing Cloudinary URLs from Database...\n')

  for (const p of products) {
    console.log(`Product: "${p.name}" (ID: ${p.id})`)
    for (const img of p.images) {
      const res = await checkUrl(img)
      console.log(`  Status ${res.status}: ${res.url}`)
    }
  }
}

main().finally(() => prisma.$disconnect())
