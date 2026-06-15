import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'

// Development test endpoint — disabled in production
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || process.env.SMTP_USER || 'kontakt@attireburg.de'

  try {
    const success = await emailService.sendOrderConfirmation({
      orderNumber: 'ATB-TEST01',
      customerName: 'Max Mustermann',
      customerEmail: to,
      items: [
        { name: 'Attireburg Hoodie Schwarz L Slim', quantity: 2, price: 89.99, size: 'L', color: 'Schwarz' },
        { name: 'Attireburg Sweat Shirt Grau M Regular', quantity: 1, price: 69.99, size: 'M', color: 'Grau' },
      ],
      totalAmount: 249.97,
      shippingAddress: 'Musterstraße 1\n93059 Regensburg\nDeutschland',
      paymentMethod: 'PayPal',
      estimatedDelivery: '2–3 Werktage',
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email with PDF invoice sent to ${to} (CC: ${process.env.OWNER_EMAIL})`,
      })
    } else {
      return NextResponse.json({ success: false, message: 'Email sending returned false' }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
