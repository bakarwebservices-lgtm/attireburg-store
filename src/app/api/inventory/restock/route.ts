import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { InventoryMonitor } from '@/lib/backorder'

const prisma = new PrismaClient()
const inventoryMonitor = new InventoryMonitor(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Process the restock event
    const result = await inventoryMonitor.triggerRestockProcessing(
      body.productId,
      body.variantId,
      body.newStock
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        backordersFulfilled: result.backordersFulfilled,
        notificationsSent: result.notificationsSent,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Inventory restock API error:', error)
    return NextResponse.json(
      { error: 'Failed to process restock event' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get monitoring statistics
    const stats = await inventoryMonitor.getMonitoringStats()

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Inventory monitoring stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring stats' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}