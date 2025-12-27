import { NextRequest, NextResponse } from 'next/server'
import { orderStatusService, OrderStatus } from '@/lib/orders/OrderStatusService'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const orderId = id
    const status = await orderStatusService.getOrderStatus(orderId)
    
    if (!status) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Get order status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const orderId = id
    const { status, trackingNumber, notes, notifyCustomer } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const result = await orderStatusService.updateOrderStatus({
      orderId,
      status: status as OrderStatus,
      trackingNumber,
      notes,
      notifyCustomer: notifyCustomer !== false // Default to true
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}