import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
      // Try database authentication first
      user = await authenticateUser(email, password)
    } catch (dbError) {
      console.log('Database not available, using demo authentication')
      
      // Demo authentication for testing
      if (email === 'demo@attireburg.de' && password === 'demo123') {
        user = {
          id: 'demo-user-1',
          email: 'demo@attireburg.de',
          name: 'Demo User',
          isAdmin: false
        }
      } else if (email === 'admin@attireburg.de' && password === 'admin123') {
        user = {
          id: 'demo-admin-1',
          email: 'admin@attireburg.de',
          name: 'Admin User',
          isAdmin: true
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten. Versuchen Sie: demo@attireburg.de / demo123' },
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