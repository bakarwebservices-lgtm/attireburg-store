import { NextRequest, NextResponse } from 'next/server'
import { googlePayService } from '@/lib/googlepay'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { paymentData, orderId } = await request.json()

    if (!paymentData || !orderId) {
      return NextResponse.json(
        { error: 'Payment Data und Order ID sind erforderlich' },
        { status: 400 }
      )
    }

    // Process the Google Pay payment
    const result = await googlePayService.processPayment(paymentData, orderId)

    if (result.success) {
      // Update order status in database
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            // You might want to add Google Pay specific fields to your schema
          }
        })
      } catch (dbError) {
        console.log('Database not available, payment processed but order not updated')
      }

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        message: 'Google Pay Zahlung erfolgreich abgeschlossen'
      })
    } else {
      return NextResponse.json(
        { error: 'Google Pay Zahlung konnte nicht verarbeitet werden' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Google Pay processing error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Google Pay Verarbeitung' },
      { status: 500 }
    )
  }
}