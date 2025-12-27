import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    
    let data
    
    switch (type) {
      case 'overview':
        const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
          prisma.product.count(),
          prisma.product.count({ where: { isActive: true } }),
          prisma.product.findMany({
            where: { stock: { lte: 5 }, isActive: true },
            select: { id: true, name: true, stock: true, price: true },
            take: 5
          })
        ])
        
        data = {
          productStats: {
            totalProducts,
            activeProducts,
            inactiveProducts: totalProducts - activeProducts
          },
          lowStockProducts,
          topSellingProducts: [] // Placeholder since we don't have sales data
        }
        break
        
      case 'products':
        const productCount = await prisma.product.count()
        const activeCount = await prisma.product.count({ where: { isActive: true } })
        
        data = {
          totalProducts: productCount,
          activeProducts: activeCount,
          inactiveProducts: productCount - activeCount
        }
        break
        
      case 'lowStock':
        const threshold = parseInt(searchParams.get('threshold') || '5')
        data = await prisma.product.findMany({
          where: { stock: { lte: threshold }, isActive: true },
          select: { id: true, name: true, stock: true, price: true },
          orderBy: { stock: 'asc' }
        })
        break
        
      case 'topSelling':
        const limit = parseInt(searchParams.get('limit') || '10')
        // Since we don't have sales data, return products by stock as proxy
        data = await prisma.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, stock: true, price: true },
          orderBy: { stock: 'desc' },
          take: limit
        })
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