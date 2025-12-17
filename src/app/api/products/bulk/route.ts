import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/productService'
import { connectDB } from '@/lib/db'

// POST /api/products/bulk - Bulk operations on products
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
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
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }
        result = await productService.bulkUpdateStatus(productIds, data.status)
        message = `Updated status for ${result} products`
        break
        
      case 'updateCategory':
        if (!data?.categoryId) {
          return NextResponse.json(
            { success: false, error: 'CategoryId is required for updateCategory action' },
            { status: 400 }
          )
        }
        result = await productService.bulkUpdateCategory(productIds, data.categoryId)
        message = `Updated category for ${result} products`
        break
        
      case 'updateFeatured':
        if (data?.featured === undefined) {
          return NextResponse.json(
            { success: false, error: 'Featured flag is required for updateFeatured action' },
            { status: 400 }
          )
        }
        result = await productService.bulkUpdateFeatured(productIds, data.featured)
        message = `Updated featured status for ${result} products`
        break
        
      case 'delete':
        result = await productService.bulkDelete(productIds)
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