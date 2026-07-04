import { NextRequest, NextResponse } from 'next/server'
import { paypalService } from '@/lib/paypal'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 PayPal order creations per IP per hour
  const ip = getClientIp(request)
  const rl = rateLimit(`paypal-create:${ip}`, { windowMs: 60 * 60 * 1000, max: 10 })
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
    // Require authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 })
    }

    const { amount, currency = 'EUR', orderId, items, shippingAddress } = await request.json()

    if (!amount || !orderId || !items || !shippingAddress) {
      return NextResponse.json({ error: 'Fehlende erforderliche Felder' }, { status: 400 })
    }

    // Ownership check: ensure the DB order belongs to this user (or is a guest order) before creating a PayPal session
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, user: { select: { email: true } } }
    })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }
    const isGuestOrder = existingOrder.user?.email === 'guest@attireburg.internal'
    if (!isGuestOrder && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 })
    }

    // Create PayPal order
    const paypalOrder = await paypalService.createOrder({
      amount,
      currency,
      orderId,
      items,
      shippingAddress
    })

    // Save paypalOrderId to the DB order record
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { paypalOrderId: paypalOrder.id }
      })
    } catch (dbErr) {
      console.error('Failed to save paypalOrderId in db order:', dbErr)
    }

    return NextResponse.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      approvalUrl: paypalOrder.links.find(
        (link: { rel: string; href: string }) =>
          link.rel === 'approve' || link.rel === 'payer-action'
      )?.href
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der PayPal-Bestellung' },
      { status: 500 }
    )
  }
}