import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { computeCanonicalKey } from '@/lib/poolUtils'
import { InventoryMonitor } from '@/lib/backorder'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const pool = await prisma.blankGarment.findUnique({
      where: { id: params.id },
      include: {
        linkedVariants: {
          select: {
            id: true,
            sku: true,
            stock: true,
            attributes: true,
            isActive: true,
            product: {
              select: { id: true, name: true, images: true }
            }
          }
        },
        poolReservations: {
          where: { expiresAt: { gt: new Date() } }
        }
      }
    })

    if (!pool) {
      return NextResponse.json({ error: 'Garment pool not found' }, { status: 404 })
    }

    const reservedStock = pool.poolReservations.reduce((sum, r) => sum + r.quantity, 0)

    return NextResponse.json({
      pool: {
        ...pool,
        reservedStock,
        availableStock: Math.max(0, pool.stock - reservedStock)
      }
    })
  } catch (error) {
    console.error('Error fetching pool detail:', error)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, garmentType, attributes, stock, notes, isActive, reason } = body

    const existingPool = await prisma.blankGarment.findUnique({
      where: { id: params.id }
    })

    if (!existingPool) {
      return NextResponse.json({ error: 'Garment pool not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (notes !== undefined) updateData.notes = notes
    if (isActive !== undefined) updateData.isActive = isActive

    const newGarmentType = garmentType || existingPool.garmentType
    const newAttributes = attributes || (existingPool.attributes as Record<string, string>)

    if (garmentType || attributes) {
      updateData.garmentType = newGarmentType
      updateData.attributes = newAttributes
      updateData.canonicalKey = computeCanonicalKey(newGarmentType, newAttributes)
    }

    if (typeof stock === 'number') {
      updateData.stock = stock
    }

    const updatedPool = await prisma.blankGarment.update({
      where: { id: params.id },
      data: updateData
    })

    // If stock increased, trigger restock fan-out notifications to linked designs
    if (typeof stock === 'number' && stock > existingPool.stock) {
      const inventoryMonitor = new InventoryMonitor(prisma)
      await inventoryMonitor.processPoolRestock(params.id, stock, existingPool.stock)
    }

    return NextResponse.json({ pool: updatedPool })
  } catch (error) {
    console.error('Error updating pool:', error)
    return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
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

    const pool = await prisma.blankGarment.findUnique({
      where: { id: params.id },
      include: {
        linkedVariants: {
          where: { isActive: true }
        }
      }
    })

    if (!pool) {
      return NextResponse.json({ error: 'Garment pool not found' }, { status: 404 })
    }

    if (pool.linkedVariants.length > 0) {
      return NextResponse.json({
        error: `Pool kann nicht gelöscht werden: ${pool.linkedVariants.length} aktive Varianten sind noch mit diesem Pool verknüpft. Bitte verknüpfen Sie diese zuerst neu.`
      }, { status: 409 })
    }

    // Soft delete preferred if stock > 0
    const url = new URL(request.url)
    const forceHard = url.searchParams.get('force') === 'true'

    if (pool.stock > 0 && !forceHard) {
      await prisma.blankGarment.update({
        where: { id: params.id },
        data: { isActive: false, stock: 0 }
      })
      return NextResponse.json({ success: true, message: 'Pool wurde deaktiviert und Lagerbestand auf 0 gesetzt.' })
    }

    await prisma.blankGarment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Garment pool deleted successfully' })
  } catch (error) {
    console.error('Error deleting pool:', error)
    return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 })
  }
}
