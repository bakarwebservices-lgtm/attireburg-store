import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/inventory'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Validate items format
    const inventoryItems = items.map((item: any) => {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Each item must have productId and positive quantity')
      }
      
      return {
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity
      }
    })

    // Check stock availability
    const stockInfo = await inventoryService.checkStock(inventoryItems)
    
    const allAvailable = stockInfo.every(info => info.available)
    const unavailableItems = stockInfo.filter(info => !info.available)

    return NextResponse.json({
      available: allAvailable,
      items: stockInfo,
      unavailableItems: unavailableItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        requested: inventoryItems.find(i => 
          i.productId === item.productId && i.variantId === item.variantId
        )?.quantity || 0,
        available: item.currentStock,
        message: `Only ${item.currentStock} items available`
      }))
    })

  } catch (error) {
    console.error('Stock check error:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Prüfen des Lagerbestands',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}