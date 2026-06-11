import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'

// Only works in development — remove before going live
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || process.env.SMTP_USER || 'kontakt@attireburg.de'

  try {
    const success = await emailService.sendOrderConfirmation({
      orderNumber: 'ATB-TEST01',
      customerName: 'Test Kunde',
      customerEmail: to,
      items: [
        { name: 'Premium Hoodie Classic', quantity: 1, price: 89.99, size: 'L', color: 'Schwarz' },
        { name: 'Winterjacke Slim', quantity: 2, price: 149.99, size: 'M' },
      ],
      totalAmount: 389.97,
      shippingAddress: 'Test Straße 1\n93059 Regensburg\nDeutschland',
      paymentMethod: 'PayPal',
      estimatedDelivery: '2–3 Werktage',
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to}`,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
        }
      })
    } else {
      return NextResponse.json({ success: false, message: 'Email sending returned false' }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
      }
    }, { status: 500 })
  }
}
