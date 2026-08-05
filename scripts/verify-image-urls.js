const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🔍 Checking database for any remaining Supabase image URLs...\n')

  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } })
  const variants = await prisma.productVariant.findMany({ select: { id: true, sku: true, images: true } })
  const categories = await prisma.category.findMany({ select: { id: true, name: true, image: true } })
  const settings = await prisma.siteSettings.findFirst({ select: { logoUrl: true } })

  let supabaseProductUrls = 0
  let cloudinaryProductUrls = 0

  let supabaseVariantUrls = 0
  let cloudinaryVariantUrls = 0

  let supabaseCategoryUrls = 0
  let cloudinaryCategoryUrls = 0

  let supabaseLogoUrl = false

  products.forEach(p => {
    p.images.forEach(img => {
      if (img.includes('supabase.co')) supabaseProductUrls++
      if (img.includes('cloudinary.com')) cloudinaryProductUrls++
    })
  })

  variants.forEach(v => {
    v.images.forEach(img => {
      if (img.includes('supabase.co')) supabaseVariantUrls++
      if (img.includes('cloudinary.com')) cloudinaryVariantUrls++
    })
  })

  categories.forEach(c => {
    if (c.image) {
      if (c.image.includes('supabase.co')) supabaseCategoryUrls++
      if (c.image.includes('cloudinary.com')) cloudinaryCategoryUrls++
    }
  })

  if (settings && settings.logoUrl) {
    if (settings.logoUrl.includes('supabase.co')) supabaseLogoUrl = true
  }

  console.log('📊 DATABASE VERIFICATION REPORT:')
  console.log('-------------------------------------------')
  console.log(`Product Images:`)
  console.log(`  - Cloudinary URLs: ${cloudinaryProductUrls}`)
  console.log(`  - Supabase URLs:   ${supabaseProductUrls}`)
  console.log(`Variant Images:`)
  console.log(`  - Cloudinary URLs: ${cloudinaryVariantUrls}`)
  console.log(`  - Supabase URLs:   ${supabaseVariantUrls}`)
  console.log(`Category Images:`)
  console.log(`  - Cloudinary URLs: ${cloudinaryCategoryUrls}`)
  console.log(`  - Supabase URLs:   ${supabaseCategoryUrls}`)
  console.log(`Logo URL:`)
  console.log(`  - Uses Supabase:   ${supabaseLogoUrl ? 'YES ❌' : 'NO ✅'}`)
  console.log('-------------------------------------------')

  if (supabaseProductUrls === 0 && supabaseVariantUrls === 0 && supabaseCategoryUrls === 0 && !supabaseLogoUrl) {
    console.log('✅ ALL DATABASE RECORDS ARE 100% POINTING TO CLOUDINARY!')
  } else {
    console.log('⚠️ Some records still point to Supabase!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
