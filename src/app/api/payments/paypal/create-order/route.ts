import { NextRequest, NextResponse } from 'next/server'
import { paypalService } from '@/lib/paypal'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
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

    const {
      amount,
      currency = 'EUR',
      orderId,
      items,
      shippingAddress
    } = await request.json()

    // Validate required fields
    if (!amount || !orderId || !items || !shippingAddress) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      )
    }

    // Create PayPal order
    const paypalOrder = await paypalService.createOrder({
      amount,
      currency,
      orderId,
      items,
      shippingAddress
    })

    return NextResponse.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      approvalUrl: paypalOrder.links.find(link => link.rel === 'approve')?.href
    })

  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der PayPal-Bestellung' },
      { status: 500 }
    )
  }
}