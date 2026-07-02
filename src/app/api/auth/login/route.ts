import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes
  const ip = getClientIp(request)
  const rl = rateLimit(`login:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in einigen Minuten erneut.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    let user = null

    try {
      // Database authentication
      user = await authenticateUser(email, password)
    } catch (dbError) {
      console.error('Database unavailable during login:', dbError)
      return NextResponse.json(
        { error: 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.' },
        { status: 503 }
      )
    }
    

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse oder Passwort' },
        { status: 401 }
      )
    }


    const token = generateToken(user)

    return NextResponse.json({
      user,
      token,
      message: 'Erfolgreich angemeldet'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}