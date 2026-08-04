import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const unlinkedVariants = await prisma.productVariant.findMany({
      where: {
        blankGarmentId: null,
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        stock: true,
        attributes: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ variants: unlinkedVariants })
  } catch (error) {
    console.error('Error fetching unlinked variants:', error)
    return NextResponse.json({ error: 'Failed to fetch unlinked variants' }, { status: 500 })
  }
}
