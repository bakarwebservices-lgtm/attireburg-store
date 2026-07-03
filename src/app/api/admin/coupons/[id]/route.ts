import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = verifyToken(auth.slice(7))
  if (!payload || !payload.isAdmin) return null
  return payload
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { code, description, discountType, discountValue, minOrderAmount, maxUses, isActive, expiresAt } = body

  try {
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        description,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? (minOrderAmount ? parseFloat(minOrderAmount) : null) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
        isActive,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
      },
    })
    return NextResponse.json({ coupon })
  } catch {
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.coupon.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
