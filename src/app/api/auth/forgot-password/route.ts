import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email/EmailService'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email ist erforderlich' },
        { status: 400 }
      )
    }

    try {
      // Find user in database
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (user) {
        // Sign reset JWT. Key is JWT_SECRET + user's current password hash.
        // This ensures the link is single-use and invalid once password changes.
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET + user.password,
          { expiresIn: '1h' }
        )

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`

        // Send email in the background (non-blocking)
        emailService.sendPasswordReset(user.email, user.name, resetUrl).catch(err => {
          console.error('Failed to send password reset email in background:', err)
        })
      }
    } catch (dbError) {
      console.error('Database query failed in forgot-password:', dbError)
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link gesendet.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
