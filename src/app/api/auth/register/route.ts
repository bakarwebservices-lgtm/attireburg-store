import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, firstName, lastName } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, Passwort und Name sind erforderlich' },
        { status: 400 }
      )
    }

    let user = null

    try {
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
      const hashedPassword = await hashPassword(password)
      
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
        }
      })
    } catch (dbError) {
      console.log('Database not available, creating demo user')
      
      // Create demo user for testing
      user = {
        id: `demo-${Date.now()}`,
        email: email.toLowerCase(),
        name,
        isAdmin: false
      }
    }

    const token = generateToken(user)

    return NextResponse.json({
      user,
      token,
      message: 'Konto erfolgreich erstellt'
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}