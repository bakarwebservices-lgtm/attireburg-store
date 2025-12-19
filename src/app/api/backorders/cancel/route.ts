import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Cancel backorder
    const result = await backorderService.cancelBackorder(
      body.orderId,
      body.reason || 'Customer cancellation'
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Backorder cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel backorder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}