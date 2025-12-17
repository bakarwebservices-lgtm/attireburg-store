import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/productService'
import { connectDB } from '@/lib/db'

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    
    let data
    
    switch (type) {
      case 'overview':
        const [productStats, lowStockProducts, topSellingProducts] = await Promise.all([
          productService.getProductStats(),
          productService.getLowStockProducts(5),
          productService.getTopSellingProducts(5)
        ])
        
        data = {
          productStats,
          lowStockProducts,
          topSellingProducts
        }
        break
        
      case 'products':
        data = await productService.getProductStats()
        break
        
      case 'lowStock':
        const threshold = parseInt(searchParams.get('threshold') || '5')
        data = await productService.getLowStockProducts(threshold)
        break
        
      case 'topSelling':
        const limit = parseInt(searchParams.get('limit') || '10')
        data = await productService.getTopSellingProducts(limit)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown analytics type: ${type}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}