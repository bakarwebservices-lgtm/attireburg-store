import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!body.totalAmount || !body.shippingAddress || !body.shippingCity || !body.shippingPostal) {
      return NextResponse.json(
        { error: 'Total amount and shipping information are required' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of body.items) {
      if (!item.productId || !item.quantity || !item.size || !item.price) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity, size, and price' },
          { status: 400 }
        )
      }
    }

    // Always use the authenticated user's ID — never trust body.userId
    const result = await backorderService.createBackorder({
      userId: user.id,
      items: body.items,
      totalAmount: parseFloat(body.totalAmount),
      currency: body.currency || 'EUR',
      shippingAddress: body.shippingAddress,
      shippingCity: body.shippingCity,
      shippingPostal: body.shippingPostal,
      expectedFulfillmentDate: body.expectedFulfillmentDate
        ? new Date(body.expectedFulfillmentDate)
        : undefined,
      paymentData: {
        paypalOrderId: body.paypalOrderId,
        paypalPayerId: body.paypalPayerId
      }
    })

    if (result.success) {
      return NextResponse.json({ success: true, orderId: result.orderId, message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Backorder creation error:', error)
    return NextResponse.json({ error: 'Failed to create backorder' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}