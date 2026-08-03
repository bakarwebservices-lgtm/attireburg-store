import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { variantId, variantIds } = await request.json()

    const pool = await prisma.blankGarment.findUnique({
      where: { id: params.id }
    })

    if (!pool) {
      return NextResponse.json({ error: 'Garment pool not found' }, { status: 404 })
    }

    const idsToLink: string[] = Array.isArray(variantIds) ? variantIds : (variantId ? [variantId] : [])

    if (idsToLink.length === 0) {
      return NextResponse.json({ error: 'No variantId provided' }, { status: 400 })
    }

    await prisma.productVariant.updateMany({
      where: { id: { in: idsToLink } },
      data: { blankGarmentId: params.id }
    })

    return NextResponse.json({ success: true, linkedCount: idsToLink.length })
  } catch (error) {
    console.error('Error linking variants to pool:', error)
    return NextResponse.json({ error: 'Failed to link variants' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { variantId, variantIds } = await request.json()
    const idsToUnlink: string[] = Array.isArray(variantIds) ? variantIds : (variantId ? [variantId] : [])

    if (idsToUnlink.length === 0) {
      return NextResponse.json({ error: 'No variantId provided' }, { status: 400 })
    }

    await prisma.productVariant.updateMany({
      where: { id: { in: idsToUnlink }, blankGarmentId: params.id },
      data: { blankGarmentId: null }
    })

    return NextResponse.json({ success: true, unlinkedCount: idsToUnlink.length })
  } catch (error) {
    console.error('Error unlinking variants from pool:', error)
    return NextResponse.json({ error: 'Failed to unlink variants' }, { status: 500 })
  }
}
