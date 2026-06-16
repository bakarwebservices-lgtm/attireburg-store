import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'
import * as fs from 'fs'
import * as path from 'path'

// Development test endpoint — disabled in production
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || process.env.SMTP_USER || 'kontakt@attireburg.de'

  // Debug: check which logo files exist
  const logoChecks: Record<string, boolean> = {}
  for (const p of ['public/attireburg-logo.png', 'public/logo.png', 'Images/Attireburg logo.png']) {
    try { fs.accessSync(path.join(process.cwd(), p)); logoChecks[p] = true } catch { logoChecks[p] = false }
  }

  try {
    const success = await emailService.sendOrderConfirmation({
      orderNumber: 'ATB-TEST01',
      customerName: 'Max Mustermann',
      customerEmail: to,
      items: [
        { name: 'Attireburg Hoodie Schwarz L Slim', quantity: 1, price: 54.99, size: 'L', color: 'Schwarz' },
        { name: 'Attireburg Sweat Shirt Grau M', quantity: 1, price: 44.99, size: 'M', color: 'Grau' },
      ],
      totalAmount: 104.97,  // 54.99 + 44.99 + 4.99 shipping
      shippingAddress: 'Max Mustermann\nMusterstraße 1\n93059 Regensburg\nDeutschland',
      paymentMethod: 'PayPal',
      estimatedDelivery: '2–3 Werktage',
    })

    return NextResponse.json({
      success,
      message: success
        ? `Test email with PDF sent to ${to} (CC: ${process.env.OWNER_EMAIL})`
        : 'Email sending returned false',
      logoFiles: logoChecks,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logoFiles: logoChecks,
    }, { status: 500 })
  }
}
