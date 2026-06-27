import { NextRequest, NextResponse } from 'next/server'
import { paypalService } from '@/lib/paypal'
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

    const { paypalOrderId, orderId } = await request.json()

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: 'PayPal Order ID und Order ID sind erforderlich' },
        { status: 400 }
      )
    }

    // Capture the PayPal payment
    const captureResult = await paypalService.captureOrder(paypalOrderId)

    if (captureResult.status === 'COMPLETED') {
      // Parse shipping details from PayPal response if available
      let shippingDetails: any = {}
      try {
        const purchaseUnit = captureResult.purchase_units?.[0]
        const shipping = purchaseUnit?.shipping
        const address = shipping?.address
        const name = shipping?.name?.full_name || ''
        
        if (address) {
          const street = address.address_line_1 + (address.address_line_2 ? '\n' + address.address_line_2 : '')
          const city = address.admin_area_2 || ''
          const postalCode = address.postal_code || ''
          const countryCode = address.country_code || 'DE'
          const country = countryCode === 'DE' ? 'Deutschland' : countryCode

          shippingDetails = {
            shippingAddress: `${name}\n${street}\n${postalCode} ${city}\n${country}`,
            shippingCity: city,
            shippingPostal: postalCode
          }
        }
      } catch (parseError) {
        console.error('Failed to parse shipping details from PayPal capture:', parseError)
      }

      // Update order status in database
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            paypalOrderId: paypalOrderId,
            paypalPayerId: captureResult.payer?.payer_id,
            ...shippingDetails
          }
        })
      } catch (dbError) {
        console.log('Database not available, payment captured but order not updated')
      }

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        transactionId: captureResult.id,
        message: 'Zahlung erfolgreich abgeschlossen'
      })
    } else {
      return NextResponse.json(
        { error: 'Zahlung konnte nicht abgeschlossen werden' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abschließen der Zahlung' },
      { status: 500 }
    )
  }
}