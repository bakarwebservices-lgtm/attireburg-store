// Database seeder for products and categories
import { prisma } from '@/lib/db'
import { ProductStatus, CatalogVisibility } from '@prisma/client'

export interface SeedData {
  categories: Array<{
    name: string
    nameEn: string
    slug: string
    description?: string
    descriptionEn?: string
    image?: string
    menuOrder: number
  }>
  products: Array<{
    name: string
    nameEn: string
    description: string
    descriptionEn: string
    shortDescription: string
    shortDescriptionEn: string
    price: number
    salePrice?: number
    sku: string
    stock: number
    categorySlug: string
    tags: string[]
    images: string[]
    slug: string
    status: ProductStatus
    featured: boolean
    weight?: number
    metaTitle?: string
    metaDescription?: string
  }>
}

const seedData: SeedData = {
  categories: [
    {
      name: 'Pullover',
      nameEn: 'Sweaters',
      slug: 'pullover',
      description: 'Hochwertige Pullover für jeden Anlass',
      descriptionEn: 'High-quality sweaters for every occasion',
      menuOrder: 1
    },
    {
      name: 'Jacken',
      nameEn: 'Jackets',
      slug: 'jacken',
      description: 'Stilvolle Jacken für die kalte Jahreszeit',
      descriptionEn: 'Stylish jackets for the cold season',
      menuOrder: 2
    },
    {
      name: 'Strickwaren',
      nameEn: 'Knitwear',
      slug: 'strickwaren',
      description: 'Handgefertigte Strickwaren aus Deutschland',
      descriptionEn: 'Handcrafted knitwear from Germany',
      menuOrder: 3
    }
  ],
  products: [
    {
      name: 'Klassischer Wollpullover',
      nameEn: 'Classic Wool Sweater',
      description: 'Ein zeitloser Wollpullover aus 100% Merinowolle. Perfekt für kalte Tage und elegante Anlässe. Hergestellt in Deutschland mit höchster Handwerkskunst.',
      descriptionEn: 'A timeless wool sweater made from 100% merino wool. Perfect for cold days and elegant occasions. Made in Germany with the highest craftsmanship.',
      shortDescription: 'Zeitloser Wollpullover aus 100% Merinowolle',
      shortDescriptionEn: 'Timeless wool sweater made from 100% merino wool',
      price: 129.99,
      salePrice: 99.99,
      sku: 'WP-001',
      stock: 25,
      categorySlug: 'pullover',
      tags: ['wolle', 'merino', 'klassisch', 'winter'],
      images: ['/images/products/wool-sweater-1.jpg', '/images/products/wool-sweater-2.jpg'],
      slug: 'klassischer-wollpullover',
      status: 'PUBLISHED',
      featured: true,
      weight: 0.5,
      metaTitle: 'Klassischer Wollpullover - Premium Merinowolle',
      metaDescription: 'Hochwertiger Wollpullover aus 100% Merinowolle. Zeitloses Design, deutsche Handwerkskunst. Jetzt online bestellen.'
    },
    {
      name: 'Winterjacke Premium',
      nameEn: 'Premium Winter Jacket',
      description: 'Eine hochwertige Winterjacke mit Daunenfüllung. Wasserdicht und atmungsaktiv. Ideal für extreme Wetterbedingungen.',
      descriptionEn: 'A high-quality winter jacket with down filling. Waterproof and breathable. Ideal for extreme weather conditions.',
      shortDescription: 'Hochwertige Winterjacke mit Daunenfüllung',
      shortDescriptionEn: 'High-quality winter jacket with down filling',
      price: 299.99,
      sku: 'WJ-001',
      stock: 15,
      categorySlug: 'jacken',
      tags: ['winter', 'daunen', 'wasserdicht', 'premium'],
      images: ['/images/products/winter-jacket-1.jpg', '/images/products/winter-jacket-2.jpg'],
      slug: 'winterjacke-premium',
      status: 'PUBLISHED',
      featured: true,
      weight: 1.2,
      metaTitle: 'Premium Winterjacke - Wasserdicht & Warm',
      metaDescription: 'Premium Winterjacke mit Daunenfüllung. Wasserdicht, atmungsaktiv und extrem warm. Deutsche Qualität.'
    },
    {
      name: 'Handgestrickter Cardigan',
      nameEn: 'Hand-knitted Cardigan',
      description: 'Ein wunderschöner handgestrickter Cardigan aus Bio-Baumwolle. Jedes Stück ist ein Unikat und wird mit Liebe zum Detail gefertigt.',
      descriptionEn: 'A beautiful hand-knitted cardigan made from organic cotton. Each piece is unique and crafted with attention to detail.',
      shortDescription: 'Handgestrickter Cardigan aus Bio-Baumwolle',
      shortDescriptionEn: 'Hand-knitted cardigan made from organic cotton',
      price: 189.99,
      sku: 'HC-001',
      stock: 8,
      categorySlug: 'strickwaren',
      tags: ['handgestrickt', 'bio-baumwolle', 'cardigan', 'unikat'],
      images: ['/images/products/cardigan-1.jpg', '/images/products/cardigan-2.jpg'],
      slug: 'handgestrickter-cardigan',
      status: 'PUBLISHED',
      featured: false,
      weight: 0.6,
      metaTitle: 'Handgestrickter Cardigan - Bio-Baumwolle',
      metaDescription: 'Einzigartiger handgestrickter Cardigan aus Bio-Baumwolle. Nachhaltig und mit Liebe zum Detail gefertigt.'
    },
    {
      name: 'Leichter Sommerpullover',
      nameEn: 'Light Summer Sweater',
      description: 'Ein leichter Pullover für die Übergangszeit. Aus atmungsaktiver Baumwoll-Leinen-Mischung. Perfekt für warme Sommerabende.',
      descriptionEn: 'A light sweater for the transitional season. Made from breathable cotton-linen blend. Perfect for warm summer evenings.',
      shortDescription: 'Leichter Pullover aus Baumwoll-Leinen-Mischung',
      shortDescriptionEn: 'Light sweater made from cotton-linen blend',
      price: 79.99,
      sku: 'SP-001',
      stock: 30,
      categorySlug: 'pullover',
      tags: ['sommer', 'leicht', 'baumwolle', 'leinen'],
      images: ['/images/products/summer-sweater-1.jpg'],
      slug: 'leichter-sommerpullover',
      status: 'PUBLISHED',
      featured: false,
      weight: 0.3,
      metaTitle: 'Leichter Sommerpullover - Baumwolle & Leinen',
      metaDescription: 'Atmungsaktiver Sommerpullover aus Baumwoll-Leinen-Mischung. Ideal für warme Tage und laue Abende.'
    },
    {
      name: 'Regenjacke Urban',
      nameEn: 'Urban Rain Jacket',
      description: 'Eine stylische Regenjacke für die Stadt. Wasserdicht, leicht und mit modernem Design. Perfekt für den urbanen Lifestyle.',
      descriptionEn: 'A stylish rain jacket for the city. Waterproof, lightweight and with modern design. Perfect for urban lifestyle.',
      shortDescription: 'Stylische Regenjacke für die Stadt',
      shortDescriptionEn: 'Stylish rain jacket for the city',
      price: 149.99,
      sku: 'RJ-001',
      stock: 20,
      categorySlug: 'jacken',
      tags: ['regen', 'urban', 'wasserdicht', 'leicht'],
      images: ['/images/products/rain-jacket-1.jpg', '/images/products/rain-jacket-2.jpg'],
      slug: 'regenjacke-urban',
      status: 'PUBLISHED',
      featured: false,
      weight: 0.4,
      metaTitle: 'Urban Regenjacke - Stylisch & Wasserdicht',
      metaDescription: 'Moderne Regenjacke für den urbanen Lifestyle. Wasserdicht, leicht und stylisch. Jetzt online kaufen.'
    }
  ]
}

export class ProductSeeder {
  async seed(): Promise<void> {
    console.log('🌱 Starting product seeding...')
    
    try {
      // Clear existing data
      await this.clearData()
      
      // Seed categories
      await this.seedCategories()
      
      // Seed products
      await this.seedProducts()
      
      console.log('✅ Product seeding completed successfully!')
    } catch (error) {
      console.error('❌ Error during seeding:', error)
      throw error
    }
  }
  
  private async clearData(): Promise<void> {
    console.log('🧹 Clearing existing data...')
    
    // Delete in correct order due to foreign key constraints
    await prisma.productAttribute.deleteMany()
    await prisma.productVariation.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.review.deleteMany()
    await prisma.wishlistItem.deleteMany()
    await prisma.product.deleteMany()
    await prisma.productCategory.deleteMany()
    
    console.log('✅ Data cleared')
  }
  
  private async seedCategories(): Promise<void> {
    console.log('📁 Seeding categories...')
    
    for (const categoryData of seedData.categories) {
      await prisma.productCategory.create({
        data: categoryData
      })
      console.log(`  ✓ Created category: ${categoryData.name}`)
    }
    
    console.log('✅ Categories seeded')
  }
  
  private async seedProducts(): Promise<void> {
    console.log('📦 Seeding products...')
    
    for (const productData of seedData.products) {
      // Find category by slug
      const category = await prisma.productCategory.findUnique({
        where: { slug: productData.categorySlug }
      })
      
      if (!category) {
        console.warn(`⚠️  Category not found for slug: ${productData.categorySlug}`)
        continue
      }
      
      // Create product
      const { categorySlug, ...productCreateData } = productData
      await prisma.product.create({
        data: {
          ...productCreateData,
          categoryId: category.id,
          catalogVisibility: 'VISIBLE' as CatalogVisibility,
          manageStock: true,
          lowStockThreshold: 5,
          enableReviews: true,
          menuOrder: 0
        }
      })
      
      console.log(`  ✓ Created product: ${productData.name}`)
    }
    
    console.log('✅ Products seeded')
  }
  
  async seedSampleUser(): Promise<void> {
    console.log('👤 Creating sample admin user...')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    })
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists')
      return
    }
    
    // Create admin user (password should be hashed in real implementation)
    await prisma.user.create({
      data: {
        email: 'admin@attireburg.de',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123', // In real app, this should be hashed
        isAdmin: true,
        isActive: true,
        language: 'de',
        country: 'Deutschland'
      }
    })
    
    console.log('✅ Sample admin user created (admin@attireburg.de / admin123)')
  }
}

export const productSeeder = new ProductSeeder()