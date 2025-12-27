import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { inventoryService } from '@/lib/inventory'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
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
    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      )
    }

    try {
      // Get the order with items
      const order = await prisma.order.findFirst({
        where: {
          id: id,
          userId: user.id, // Ensure user can only cancel their own orders
          status: { in: ['PENDING', 'PROCESSING'] } // Only allow cancellation of pending/processing orders
        },
        include: {
          items: true
        }
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Bestellung nicht gefunden oder kann nicht storniert werden' },
          { status: 404 }
        )
      }

      // Prepare inventory items for restoration
      const inventoryItems = order.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity
      }))

      // Restore inventory
      const inventoryResult = await inventoryService.restoreInventory(inventoryItems)
      
      if (!inventoryResult.success) {
        console.error('Failed to restore inventory:', inventoryResult.errors)
        // Continue with cancellation even if inventory restoration fails
        // This prevents orders from being stuck in a non-cancellable state
      }

      // Update order status to cancelled
      const cancelledOrder = await prisma.order.update({
        where: { id: id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  nameEn: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Bestellung erfolgreich storniert',
        order: cancelledOrder,
        inventoryRestored: inventoryResult.success,
        inventoryErrors: inventoryResult.errors
      })

    } catch (dbError) {
      console.error('Database error during order cancellation:', dbError)
      return NextResponse.json(
        { error: 'Datenbankfehler beim Stornieren der Bestellung' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Order cancellation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Stornieren der Bestellung' },
      { status: 500 }
    )
  }
}