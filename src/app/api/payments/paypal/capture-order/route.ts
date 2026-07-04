import { NextRequest, NextResponse } from 'next/server'
import { paypalService } from '@/lib/paypal'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email/EmailService'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 capture attempts per IP per hour
  const ip = getClientIp(request)
  const rl = rateLimit(`paypal-capture:${ip}`, { windowMs: 60 * 60 * 1000, max: 10 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Zahlungsversuche. Bitte versuchen Sie es später erneut.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  try {
    // Auth is optional — guests can complete PayPal capture via pending_order_id
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    const { paypalOrderId, orderId, guestEmail: guestEmailParam } = await request.json()

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: 'PayPal Order ID und Order ID sind erforderlich' },
        { status: 400 }
      )
    }

    // Ownership check — allow authenticated users owning the order, or guest orders
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, user: { select: { email: true } } }
    })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }
    const isGuestOrder = existingOrder.user?.email === 'guest@attireburg.internal'
    if (!isGuestOrder && user && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 })
    }
    if (!isGuestOrder && !user) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 })
    }


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
      let updatedOrder = null
      try {
        updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            paypalOrderId: paypalOrderId,
            paypalPayerId: captureResult.payer?.payer_id,
            ...shippingDetails
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: true
          }
        })
      } catch (dbError) {
        console.error('Database update failed during capture:', dbError)
      }

      // Send order confirmation email / invoice now that payment is captured and address is updated
      if (updatedOrder) {
        // For guest orders, get real email from PayPal payer info or shipping address
        const isGuestUser = updatedOrder.user?.email === 'guest@attireburg.internal'
        const payerEmail = captureResult.payer?.email_address
        const customerEmail = isGuestUser
          ? (guestEmailParam || payerEmail || '')
          : updatedOrder.user.email

        const emailData = {
          orderNumber: `ATB-${updatedOrder.id.slice(-6).toUpperCase()}`,
          customerName: updatedOrder.shippingAddress.split('\n')[0] || updatedOrder.user.name,
          customerEmail,
          items: updatedOrder.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color
          })),
          totalAmount: updatedOrder.totalAmount,
          shippingAddress: updatedOrder.shippingAddress,
          paymentMethod: 'PayPal',
          estimatedDelivery: '2-3 Werktage'
        }

        if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
          try {
            await emailService.sendOrderConfirmation(emailData)
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError)
          }
        } else {
          emailService.sendOrderConfirmation(emailData).catch((emailError) => {
            console.error('Failed to send order confirmation email in background:', emailError)
          })
        }
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