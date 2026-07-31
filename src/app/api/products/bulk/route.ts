import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/products/bulk - Bulk operations on products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productIds, data } = body
    
    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: action, productIds' 
        },
        { status: 400 }
      )
    }
    
    let result
    let message
    
    switch (action) {
      case 'updateStatus':
        if (data?.status === undefined) {
          return NextResponse.json(
            { success: false, error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }
        const statusResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: data.status }
        })
        result = statusResult.count
        message = `Updated status for ${result} products`
        break
        
      case 'updateCategory':
        if (!data?.categoryId) {
          return NextResponse.json(
            { success: false, error: 'CategoryId is required for updateCategory action' },
            { status: 400 }
          )
        }
        const categoryResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { category: data.categoryId }
        })
        result = categoryResult.count
        message = `Updated category for ${result} products`
        break
        
      case 'updateFeatured':
        if (data?.featured === undefined) {
          return NextResponse.json(
            { success: false, error: 'Featured flag is required for updateFeatured action' },
            { status: 400 }
          )
        }
        const featuredResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { featured: data.featured }
        })
        result = featuredResult.count
        message = `Updated featured status for ${result} products`
        break
        
      case 'delete':
        // First delete related variants
        await prisma.productVariant.deleteMany({
          where: { productId: { in: productIds } }
        })
        
        const deleteResult = await prisma.product.deleteMany({
          where: { id: { in: productIds } }
        })
        result = deleteResult.count
        message = `Deleted ${result} products`
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message,
      affected: result
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}