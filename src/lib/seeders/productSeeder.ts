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
      description: 'Ein zeitloser Wollpullover aus 100% Merinowolle. Perfekt für kalte Tage und elegante Anlässe. Hergestellt in Deutschland mit höchster Handwerkskunst. Die weiche Merinowolle bietet optimalen Tragekomfort und natürliche Temperaturregulierung.',
      descriptionEn: 'A timeless wool sweater made from 100% merino wool. Perfect for cold days and elegant occasions. Made in Germany with the highest craftsmanship. The soft merino wool offers optimal wearing comfort and natural temperature regulation.',
      shortDescription: 'Zeitloser Wollpullover aus 100% Merinowolle',
      shortDescriptionEn: 'Timeless wool sweater made from 100% merino wool',
      price: 129.99,
      salePrice: 99.99,
      sku: 'WP-001',
      stock: 25,
      categorySlug: 'pullover',
      tags: ['wolle', 'merino', 'klassisch', 'winter'],
      images: [
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
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
      description: 'Eine hochwertige Winterjacke mit Daunenfüllung. Wasserdicht und atmungsaktiv. Ideal für extreme Wetterbedingungen. Die 700-Fill-Power-Daunen sorgen für optimale Wärmeisolierung bei minimalem Gewicht.',
      descriptionEn: 'A high-quality winter jacket with down filling. Waterproof and breathable. Ideal for extreme weather conditions. The 700-fill-power down provides optimal thermal insulation with minimal weight.',
      shortDescription: 'Hochwertige Winterjacke mit Daunenfüllung',
      shortDescriptionEn: 'High-quality winter jacket with down filling',
      price: 299.99,
      sku: 'WJ-001',
      stock: 15,
      categorySlug: 'jacken',
      tags: ['winter', 'daunen', 'wasserdicht', 'premium'],
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
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
      description: 'Ein wunderschöner handgestrickter Cardigan aus Bio-Baumwolle. Jedes Stück ist ein Unikat und wird mit Liebe zum Detail gefertigt. Die nachhaltige Bio-Baumwolle ist besonders hautfreundlich und langlebig.',
      descriptionEn: 'A beautiful hand-knitted cardigan made from organic cotton. Each piece is unique and crafted with attention to detail. The sustainable organic cotton is particularly skin-friendly and durable.',
      shortDescription: 'Handgestrickter Cardigan aus Bio-Baumwolle',
      shortDescriptionEn: 'Hand-knitted cardigan made from organic cotton',
      price: 189.99,
      sku: 'HC-001',
      stock: 8,
      categorySlug: 'strickwaren',
      tags: ['handgestrickt', 'bio-baumwolle', 'cardigan', 'unikat'],
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
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
      description: 'Ein leichter Pullover für die Übergangszeit. Aus atmungsaktiver Baumwoll-Leinen-Mischung. Perfekt für warme Sommerabende. Die natürlichen Fasern sorgen für ein angenehmes Tragegefühl auch bei höheren Temperaturen.',
      descriptionEn: 'A light sweater for the transitional season. Made from breathable cotton-linen blend. Perfect for warm summer evenings. The natural fibers ensure a comfortable wearing experience even at higher temperatures.',
      shortDescription: 'Leichter Pullover aus Baumwoll-Leinen-Mischung',
      shortDescriptionEn: 'Light sweater made from cotton-linen blend',
      price: 79.99,
      sku: 'SP-001',
      stock: 30,
      categorySlug: 'pullover',
      tags: ['sommer', 'leicht', 'baumwolle', 'leinen'],
      images: [
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
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
      description: 'Eine stylische Regenjacke für die Stadt. Wasserdicht, leicht und mit modernem Design. Perfekt für den urbanen Lifestyle. Die innovative Membran hält Sie trocken, ohne die Atmungsaktivität zu beeinträchtigen.',
      descriptionEn: 'A stylish rain jacket for the city. Waterproof, lightweight and with modern design. Perfect for urban lifestyle. The innovative membrane keeps you dry without compromising breathability.',
      shortDescription: 'Stylische Regenjacke für die Stadt',
      shortDescriptionEn: 'Stylish rain jacket for the city',
      price: 149.99,
      sku: 'RJ-001',
      stock: 20,
      categorySlug: 'jacken',
      tags: ['regen', 'urban', 'wasserdicht', 'leicht'],
      images: [
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1556821840-3a9fbc86339e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
      slug: 'regenjacke-urban',
      status: 'PUBLISHED',
      featured: false,
      weight: 0.4,
      metaTitle: 'Urban Regenjacke - Stylisch & Wasserdicht',
      metaDescription: 'Moderne Regenjacke für den urbanen Lifestyle. Wasserdicht, leicht und stylisch. Jetzt online kaufen.'
    },
    {
      name: 'Cashmere Pullover Deluxe',
      nameEn: 'Deluxe Cashmere Sweater',
      description: 'Ein luxuriöser Cashmere-Pullover aus feinster mongolischer Cashmere-Wolle. Unvergleichlich weich und warm. Ein Investitionsstück für die Ewigkeit. Handgefertigt von Meistern ihres Fachs.',
      descriptionEn: 'A luxurious cashmere sweater made from the finest Mongolian cashmere wool. Incomparably soft and warm. An investment piece for eternity. Handcrafted by masters of their trade.',
      shortDescription: 'Luxuriöser Cashmere-Pullover aus feinster Wolle',
      shortDescriptionEn: 'Luxurious cashmere sweater made from finest wool',
      price: 399.99,
      sku: 'CP-001',
      stock: 5,
      categorySlug: 'pullover',
      tags: ['cashmere', 'luxus', 'premium', 'handgefertigt'],
      images: [
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
      slug: 'cashmere-pullover-deluxe',
      status: 'PUBLISHED',
      featured: true,
      weight: 0.4,
      metaTitle: 'Cashmere Pullover Deluxe - Mongolische Cashmere-Wolle',
      metaDescription: 'Luxuriöser Cashmere-Pullover aus feinster mongolischer Wolle. Handgefertigt, unvergleichlich weich und warm.'
    },
    {
      name: 'Trenchcoat Klassik',
      nameEn: 'Classic Trench Coat',
      description: 'Ein zeitloser Trenchcoat im klassischen Stil. Aus hochwertigem Gabardine-Stoff gefertigt. Wasserdicht und elegant zugleich. Ein Must-have für jede Garderobe. Mit abnehmbarem Futter für ganzjährigen Tragekomfort.',
      descriptionEn: 'A timeless trench coat in classic style. Made from high-quality gabardine fabric. Waterproof and elegant at the same time. A must-have for every wardrobe. With removable lining for year-round wearing comfort.',
      shortDescription: 'Zeitloser Trenchcoat aus hochwertigem Gabardine',
      shortDescriptionEn: 'Timeless trench coat made from high-quality gabardine',
      price: 249.99,
      sku: 'TC-001',
      stock: 12,
      categorySlug: 'jacken',
      tags: ['trenchcoat', 'klassisch', 'gabardine', 'elegant'],
      images: [
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
      ],
      slug: 'trenchcoat-klassik',
      status: 'PUBLISHED',
      featured: true,
      weight: 0.8,
      metaTitle: 'Trenchcoat Klassik - Hochwertiger Gabardine',
      metaDescription: 'Zeitloser Trenchcoat aus hochwertigem Gabardine-Stoff. Wasserdicht, elegant und vielseitig einsetzbar.'
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