import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per IP per hour
  const ip = getClientIp(request)
  const rl = rateLimit(`register:${ip}`, { windowMs: 60 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  try {
    const { email, password, name, firstName, lastName } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, Passwort und Name sind erforderlich' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Das Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 409 }
      )
    }

    // Hash password and create user
    // isAdmin is explicitly set to false — never trust client input for this field
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        isAdmin: false, // Mass-assignment guard: never let client set this
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      }
    })

    const token = generateToken(user)

    return NextResponse.json(
      { user, token, message: 'Konto erfolgreich erstellt' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    // If it's a DB connectivity error, return 503; don't issue demo tokens
    return NextResponse.json(
      { error: 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.' },
      { status: 503 }
    )
  }
}