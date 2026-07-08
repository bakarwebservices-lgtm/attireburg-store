import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, orderAmount } = await req.json()

  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  })

  if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  if (!coupon.isActive) return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 })
  if (coupon.expiresAt) {
    const expiryDate = new Date(coupon.expiresAt)
    expiryDate.setHours(23, 59, 59, 999)
    if (new Date() > expiryDate) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
    }
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
  }
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    return NextResponse.json({
      error: `Minimum order amount of €${coupon.minOrderAmount.toFixed(2)} required`,
    }, { status: 400 })
  }

  const discount = coupon.discountType === 'percentage'
    ? (orderAmount * coupon.discountValue) / 100
    : coupon.discountValue

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    },
    discountAmount: Math.min(discount, orderAmount),
  })
}
