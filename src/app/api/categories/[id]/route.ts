import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const categoryName = id
    
    // Get products in this category
    const products = await prisma.product.findMany({
      where: { 
        category: categoryName,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        price: true,
        salePrice: true,
        images: true,
        stock: true
      }
    })
    
    // Get category info (simulated since we don't have a Category model)
    const category = {
      id: categoryName,
      name: categoryName,
      nameEn: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      productCount: products.length
    }
    
    return NextResponse.json({
      success: true,
      category,
      products
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}