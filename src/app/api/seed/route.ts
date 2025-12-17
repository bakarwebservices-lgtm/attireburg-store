import { NextRequest, NextResponse } from 'next/server'
import { prisma, connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// Shared seeding logic
async function seedDatabase(type: string = 'all') {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is not allowed in production')
  }
  
  await connectDB()
  
  let message = ''
  
  if (type === 'user' || type === 'all') {
    // Create admin user
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    })
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123')
      await prisma.user.create({
        data: {
          email: 'admin@attireburg.de',
          name: 'Admin User',
          firstName: 'Admin',
          lastName: 'User',
          password: hashedPassword,
          isAdmin: true,
          isActive: true,
          country: 'Germany'
        }
      })
      console.log('✅ Sample admin user created')
    }
  }
  
  if (type === 'products' || type === 'all') {
    // Create a simple sample product
    const existingProduct = await prisma.product.findFirst({
      where: { sku: 'WP-001' }
    })
    
    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: 'Klassischer Wollpullover',
          nameEn: 'Classic Wool Sweater',
          description: 'Ein zeitloser Wollpullover aus 100% Merinowolle. Perfekt für kalte Tage.',
          descriptionEn: 'A timeless wool sweater made from 100% merino wool. Perfect for cold days.',
          price: 129.99,
          salePrice: 99.99,
          sku: 'WP-001',
          stock: 25,
          category: 'Pullover',
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['Schwarz', 'Grau', 'Beige'],
          tags: ['wolle', 'merino', 'klassisch', 'winter'],
          images: ['/images/products/wool-sweater-1.jpg'],
          featured: true,
          onSale: true
        }
      })
      console.log('✅ Created sample product')
    }
  }
  
  switch (type) {
    case 'products':
      message = 'Products and categories seeded successfully'
      break
    case 'user':
      message = 'Sample admin user created successfully'
      break
    case 'all':
      message = 'Database seeded successfully with products, categories, and admin user'
      break
    default:
      throw new Error(`Unknown seed type: ${type}`)
  }
  
  return message
}

// GET /api/seed - Seed database (for browser access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    
    const message = await seedDatabase(type)
    
    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/seed - Seed database with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { type = 'all' } = body
    
    const message = await seedDatabase(type)
    
    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}