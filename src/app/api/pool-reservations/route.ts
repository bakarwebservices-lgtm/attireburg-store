import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { checkoutId, items } = await request.json()

    if (!checkoutId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing checkoutId or items' }, { status: 400 })
    }

    const reservations = []
    const errors: string[] = []

    // Lazy cleanup expired holds
    prisma.poolReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    }).catch(() => {})

    for (const item of items) {
      if (!item.variantId || !item.quantity) continue

      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { blankGarmentId: true }
      })

      if (!variant?.blankGarmentId) continue

      const poolId = variant.blankGarmentId

      // Transaction per item to ensure reservation doesn't exceed pool stock
      const result = await prisma.$transaction(async (tx) => {
        const pool = await tx.blankGarment.findUnique({
          where: { id: poolId },
          select: { stock: true, isActive: true }
        })

        if (!pool || !pool.isActive) {
          throw new Error('Garment pool is inactive or unavailable')
        }

        const otherReservations = await tx.poolReservation.aggregate({
          where: {
            blankGarmentId: poolId,
            expiresAt: { gt: new Date() },
            checkoutId: { not: checkoutId }
          },
          _sum: { quantity: true }
        })

        const available = pool.stock - (otherReservations._sum.quantity || 0)

        if (available < item.quantity) {
          throw new Error(`Nur noch ${Math.max(0, available)} Stück im Pool verfügbar`)
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min TTL

        const reservation = await tx.poolReservation.upsert({
          where: {
            checkoutId_blankGarmentId: {
              checkoutId,
              blankGarmentId: poolId
            }
          },
          update: {
            quantity: item.quantity,
            expiresAt
          },
          create: {
            checkoutId,
            blankGarmentId: poolId,
            quantity: item.quantity,
            expiresAt
          }
        })

        return reservation
      }).catch(err => {
        errors.push(err instanceof Error ? err.message : 'Reservation failed')
        return null
      })

      if (result) {
        reservations.push(result)
      }
    }

    if (errors.length > 0 && reservations.length === 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 409 })
    }

    return NextResponse.json({ success: true, reservations, errors })
  } catch (error) {
    console.error('Error creating pool reservations:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { checkoutId } = await request.json()

    if (!checkoutId) {
      return NextResponse.json({ error: 'Missing checkoutId' }, { status: 400 })
    }

    await prisma.poolReservation.deleteMany({
      where: { checkoutId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing pool reservations:', error)
    return NextResponse.json({ error: 'Failed to clear reservation' }, { status: 500 })
  }
}
