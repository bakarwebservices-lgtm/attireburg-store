import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per IP per 15 minutes
  const ip = getClientIp(request)
  const rl = rateLimit(`reset-password:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  try {
    const { email, token, password } = await request.json()

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, Token und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Das Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Find the user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    try {
      // Verify token with signing key: JWT_SECRET + user's current password hash.
      // If the password was already reset, this hash will mismatch and verification will throw.
      jwt.verify(token, JWT_SECRET + user.password)
    } catch (err) {
      console.error('Password reset token verification failed:', err)
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Reset-Link' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Save the new password to database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'Ihr Passwort wurde erfolgreich zurückgesetzt.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
