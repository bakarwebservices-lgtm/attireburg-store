import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - public, fetches one page by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const content = await prisma.legalContent.findUnique({ where: { id } })
    return NextResponse.json(content || null)
  } catch (error) {
    console.error('Legal GET error:', error)
    return NextResponse.json(null)
  }
}

// POST - admin only, upsert a page
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, contentDe, contentEn } = await request.json()
    if (!id || !contentDe || !contentEn) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const content = await prisma.legalContent.upsert({
      where: { id },
      update: { contentDe, contentEn },
      create: { id, contentDe, contentEn },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Legal POST error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
