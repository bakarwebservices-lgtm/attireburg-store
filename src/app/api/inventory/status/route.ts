import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { inventoryService } from '@/lib/inventory'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '5')
    const productId = searchParams.get('productId')

    if (productId) {
      // Get stock info for specific product
      const productStock = await inventoryService.getProductStock(productId)
      return NextResponse.json({
        productId,
        ...productStock
      })
    } else {
      // Get low stock alerts
      const lowStockAlerts = await inventoryService.getLowStockAlerts(threshold)
      return NextResponse.json({
        threshold,
        lowStockCount: lowStockAlerts.products.length + lowStockAlerts.variants.length,
        ...lowStockAlerts
      })
    }

  } catch (error) {
    console.error('Inventory status error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Lagerbestands' },
      { status: 500 }
    )
  }
}