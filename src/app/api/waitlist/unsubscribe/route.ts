import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'
import { verifyToken as verifyJWT } from '@/lib/auth'
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

function htmlPage(title: string, heading: string, body: string, isError = false): NextResponse {
  const color = isError ? '#dc3545' : '#28a745'
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title} - Attireburg</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .msg { color: ${color}; }
    .container { text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${heading}</h1>
    <p class="msg">${body}</p>
    <a href="/">Zurück zu Attireburg</a>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status: isError ? 400 : 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

/**
 * DELETE /api/waitlist/unsubscribe
 * Authenticated (JWT) — for in-app unsubscribe actions.
 * Users may only unsubscribe their own email.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require JWT auth
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const user = verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.email || !body.productId) {
      return NextResponse.json({ error: 'Email and product ID are required' }, { status: 400 })
    }

    // Ownership: non-admins can only unsubscribe their own email
    if (!user.isAdmin && body.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await waitlistService.unsubscribe(
      body.email,
      body.productId,
      body.variantId || undefined
    )

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Waitlist unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe from waitlist' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * GET /api/waitlist/unsubscribe?email=&productId=&variantId=&token=
 * Used by one-click unsubscribe links in emails.
 * Requires a valid HMAC token (generated at email-send time by createUnsubscribeToken).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId') || undefined
    const token = searchParams.get('token')

    if (!email || !productId) {
      return htmlPage(
        'Fehler beim Abmelden',
        'Fehler beim Abmelden',
        'E-Mail und Produkt-ID sind erforderlich.',
        true
      )
    }

    // Validate HMAC token — required for email-link unsubscribes
    if (!token) {
      return htmlPage(
        'Ungültiger Link',
        'Ungültiger Link',
        'Dieser Abmelde-Link ist ungültig oder wurde bereits verwendet.',
        true
      )
    }

    const tokenValid = verifyUnsubscribeToken(token, email, productId, variantId)
    if (!tokenValid) {
      return htmlPage(
        'Abgelaufener Link',
        'Link abgelaufen oder ungültig',
        'Dieser Abmelde-Link ist abgelaufen oder ungültig. Bitte melden Sie sich erneut an und versuchen Sie es über Ihr Konto.',
        true
      )
    }

    const result = await waitlistService.unsubscribe(email, productId, variantId)

    if (result.success) {
      return htmlPage(
        'Erfolgreich abgemeldet',
        'Erfolgreich abgemeldet',
        'Sie wurden erfolgreich von der Warteliste entfernt und erhalten keine weiteren Benachrichtigungen für dieses Produkt.'
      )
    } else {
      return htmlPage(
        'Fehler beim Abmelden',
        'Fehler beim Abmelden',
        result.message,
        true
      )
    }
  } catch (error) {
    console.error('Waitlist unsubscribe error:', error)
    return htmlPage(
      'Serverfehler',
      'Serverfehler',
      'Beim Abmelden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
      true
    )
  } finally {
    await prisma.$disconnect()
  }
}