import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    if (orderId) {
      // Get specific backorder status
      const backorderStatus = await backorderService.getBackorderStatus(orderId)
      
      if (!backorderStatus) {
        return NextResponse.json(
          { error: 'Backorder not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        backorder: backorderStatus
      })
    } else if (userId) {
      // Get all backorders for a customer
      const customerBackorders = await backorderService.getCustomerBackorders(userId)
      
      return NextResponse.json({
        backorders: customerBackorders,
        count: customerBackorders.length
      })
    } else {
      return NextResponse.json(
        { error: 'Either orderId or userId is required' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Backorder status error:', error)
    return NextResponse.json(
      { error: 'Failed to get backorder status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}