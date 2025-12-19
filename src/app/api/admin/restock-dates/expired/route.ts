import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { InventoryMonitor } from '@/lib/backorder'

const prisma = new PrismaClient()
const inventoryMonitor = new InventoryMonitor(prisma)

export async function POST(request: NextRequest) {
  try {
    // Process expired restock dates
    const result = await inventoryMonitor.processExpiredRestockDates()

    if (result.success) {
      return NextResponse.json({
        success: true,
        expiredCount: result.expiredCount,
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
    console.error('Process expired restock dates API error:', error)
    return NextResponse.json(
      { error: 'Failed to process expired restock dates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}