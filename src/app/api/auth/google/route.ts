import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle local demo mode when client ID isn't configured
    if (body.isDemo) {
      const email = body.email || 'google-demo@attireburg.de'
      const name = body.name || 'Google Test User'

      let user = null
      try {
        // Check if user already exists
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        })

        if (!user) {
          // Create a new user with google login
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: name,
              password: '', // Empty password for oauth users
            }
          })
        }
      } catch (dbError) {
        console.log('Database not available, using demo user object')
        user = {
          id: 'demo-google-user-1',
          email: email.toLowerCase(),
          name: name,
          isAdmin: false
        }
      }

      const token = generateToken(user)
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: 'isAdmin' in user ? user.isAdmin : false
        },
        token,
        message: 'Erfolgreich angemeldet'
      })
    }

    const { credential, accessToken } = body
    if (!credential && !accessToken) {
      return NextResponse.json(
        { error: 'Credential oder Access Token ist erforderlich' },
        { status: 400 }
      )
    }

    let email = ''
    let name = ''
    let givenName = ''
    let familyName = ''

    if (accessToken) {
      // Verify and fetch profile using access token
      const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
      if (!googleRes.ok) {
        return NextResponse.json(
          { error: 'Ungültiges Google Access Token' },
          { status: 400 }
        )
      }
      const payload = await googleRes.json()
      email = payload.email
      name = payload.name
      givenName = payload.given_name || ''
      familyName = payload.family_name || ''
    } else if (credential) {
      // Verify and fetch profile using ID token (credential)
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
      if (!googleRes.ok) {
        return NextResponse.json(
          { error: 'Ungültiges Google ID Token' },
          { status: 400 }
        )
      }
      const payload = await googleRes.json()
      email = payload.email
      name = payload.name
      givenName = payload.given_name || ''
      familyName = payload.family_name || ''
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email konnte nicht aus Google Profil abgerufen werden' },
        { status: 400 }
      )
    }

    let user = null
    try {
      // Check if user exists in database
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        // Create user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name || givenName || email.split('@')[0],
            firstName: givenName,
            lastName: familyName,
            password: '', // Empty password for Google Auth users
          }
        })
      }
    } catch (dbError) {
      console.log('Database not available, using dynamic user from Google profile')
      user = {
        id: `google-${email.toLowerCase()}`,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        isAdmin: false
      }
    }

    const token = generateToken(user)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: 'isAdmin' in user ? user.isAdmin : false
      },
      token,
      message: 'Erfolgreich angemeldet'
    })

  } catch (error) {
    console.error('Google Auth error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten während der Google Anmeldung' },
      { status: 500 }
    )
  }
}
