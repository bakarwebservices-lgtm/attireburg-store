import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function PUT(request: NextRequest) {
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

    if (!body.orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Ownership check: non-admins can only cancel their own backorders
    if (!user.isAdmin) {
      const backorder = await backorderService.getBackorderStatus(body.orderId)
      if (!backorder) {
        return NextResponse.json({ error: 'Backorder not found' }, { status: 404 })
      }
      if ((backorder as any).userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const result = await backorderService.cancelBackorder(body.orderId)

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Backorder cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel backorder' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}