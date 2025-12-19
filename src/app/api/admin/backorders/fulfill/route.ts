import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function PUT(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    
    // Validate required fields
    if (!body.productId || !body.availableQuantity) {
      return NextResponse.json(
        { error: 'Product ID and available quantity are required' },
        { status: 400 }
      )
    }

    const availableQuantity = parseInt(body.availableQuantity)
    if (availableQuantity <= 0) {
      return NextResponse.json(
        { error: 'Available quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Fulfill backorders
    const result = await backorderService.fulfillBackorders(
      body.productId,
      body.variantId || undefined,
      availableQuantity
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        fulfilledOrders: result.fulfilledOrders,
        remainingQuantity: result.remainingQuantity
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Backorder fulfillment error:', error)
    return NextResponse.json(
      { error: 'Failed to fulfill backorders' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}