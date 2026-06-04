import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PATCH - update email, name, phone OR change password
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tokenUser = verifyToken(token)
    if (!tokenUser) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { type } = body

    if (type === 'profile') {
      // Update name / email / phone
      const { firstName, lastName, email, phone } = body

      // Check if new email is already taken by another user
      if (email && email !== tokenUser.email) {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing && existing.id !== tokenUser.id) {
          return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits vergeben' }, { status: 400 })
        }
      }

      const updated = await prisma.user.update({
        where: { id: tokenUser.id },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
          email: email || undefined,
          phone: phone || undefined,
        },
        select: {
          id: true, name: true, firstName: true, lastName: true,
          email: true, phone: true, isAdmin: true,
        },
      })

      return NextResponse.json({ user: updated, message: 'Profil erfolgreich aktualisiert' })
    }

    if (type === 'password') {
      const { currentPassword, newPassword } = body

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 })
      }

      // Fetch current hashed password
      const dbUser = await prisma.user.findUnique({ where: { id: tokenUser.id } })
      if (!dbUser) return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })

      const valid = await bcrypt.compare(currentPassword, dbUser.password)
      if (!valid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }

      const hashed = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: tokenUser.id },
        data: { password: hashed },
      })

      return NextResponse.json({ message: 'Passwort erfolgreich geändert' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}
