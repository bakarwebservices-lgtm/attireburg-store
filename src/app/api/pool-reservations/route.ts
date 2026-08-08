import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { checkoutId, items } = await request.json()

    if (!checkoutId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing checkoutId or items' }, { status: 400 })
    }

    // Lazy cleanup expired holds
    prisma.poolReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    }).catch(() => {})

    // Fix 3: Resolve all variantIds → blankGarmentIds in a single batch query,
    // then SUM quantities per unique pool before upserting. Previously, iterating
    // per-item and upserting with quantity: item.quantity (overwrite, not increment)
    // caused the reservation for a pool to reflect only the last cart item's quantity
    // when multiple cart items (different products) mapped to the same pool.
    const variantIds = items
      .filter((i: any) => i.variantId && i.quantity)
      .map((i: any) => i.variantId as string)

    const resolvedVariants = variantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, blankGarmentId: true }
        })
      : []

    const variantToPoolId = new Map<string, string>(
      resolvedVariants
        .filter(v => v.blankGarmentId)
        .map(v => [v.id, v.blankGarmentId!])
    )

    // Aggregate total quantity per pool across all cart items
    const poolQuantityMap = new Map<string, number>() // blankGarmentId → total qty
    for (const item of items) {
      if (!item.variantId || !item.quantity) continue
      const poolId = variantToPoolId.get(item.variantId)
      if (!poolId) continue
      poolQuantityMap.set(poolId, (poolQuantityMap.get(poolId) ?? 0) + item.quantity)
    }

    const reservations = []
    const errors: string[] = []

    // Upsert once per unique pool with the correct combined quantity
    for (const [poolId, totalQty] of poolQuantityMap) {
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

        const available = pool.stock - (otherReservations._sum.quantity ?? 0)

        if (available < totalQty) {
          throw new Error(`Nur noch ${Math.max(0, available)} Stück im Pool verfügbar`)
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min TTL

        // Upsert with totalQty (sum across all cart items for this pool)
        const reservation = await tx.poolReservation.upsert({
          where: {
            checkoutId_blankGarmentId: {
              checkoutId,
              blankGarmentId: poolId
            }
          },
          update: {
            quantity: totalQty,
            expiresAt
          },
          create: {
            checkoutId,
            blankGarmentId: poolId,
            quantity: totalQty,
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

    // Fix 4: Return 409 if ANY pool reservation failed (not only when all fail).
    // A partial failure means the customer's hold on some pools is incomplete —
    // this must be surfaced rather than silently returning 200 with buried errors.
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', '), reservations, errors },
        { status: 409 }
      )
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
