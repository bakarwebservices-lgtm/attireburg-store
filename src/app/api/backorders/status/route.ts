import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      const backorderStatus = await backorderService.getBackorderStatus(orderId)

      if (!backorderStatus) {
        return NextResponse.json({ error: 'Backorder not found' }, { status: 404 })
      }

      // Ownership check: non-admins can only read their own backorders
      if (!user.isAdmin && (backorderStatus as any).userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return NextResponse.json({ backorder: backorderStatus })
    } else {
      // Return only the authenticated user's backorders (admins pass ?userId= to override)
      const targetUserId = user.isAdmin
        ? (searchParams.get('userId') || user.id)
        : user.id

      const customerBackorders = await backorderService.getCustomerBackorders(targetUserId)

      return NextResponse.json({
        backorders: customerBackorders,
        count: customerBackorders.length
      })
    }
  } catch (error) {
    console.error('Backorder status error:', error)
    return NextResponse.json({ error: 'Failed to get backorder status' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}