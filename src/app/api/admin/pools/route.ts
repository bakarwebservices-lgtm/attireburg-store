import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { computeCanonicalKey } from '@/lib/poolUtils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const orphanedOnly = searchParams.get('orphaned') === 'true'

    let where: any = {}
    if (orphanedOnly) {
      where = {
        stock: { gt: 0 },
        isActive: true,
        linkedVariants: {
          none: { isActive: true }
        }
      }
    }

    const pools = await prisma.blankGarment.findMany({
      where,
      include: {
        linkedVariants: {
          select: {
            id: true,
            sku: true,
            isActive: true,
            product: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = pools.map(p => ({
      ...p,
      totalLinkedCount: p.linkedVariants.length,
      activeLinkedCount: p.linkedVariants.filter(v => v.isActive).length,
      isOrphaned: p.stock > 0 && p.linkedVariants.filter(v => v.isActive).length === 0
    }))

    return NextResponse.json({ pools: formatted })
  } catch (error) {
    console.error('Error fetching garment pools:', error)
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, garmentType, attributes, stock, notes } = await request.json()

    if (!name || !garmentType || !attributes) {
      return NextResponse.json({ error: 'Name, garmentType, and attributes are required' }, { status: 400 })
    }

    const canonicalKey = computeCanonicalKey(garmentType, attributes)

    // Check if a pool with this canonical key already exists
    const existingPool = await prisma.blankGarment.findUnique({
      where: { canonicalKey }
    })

    if (existingPool) {
      return NextResponse.json({
        pool: existingPool,
        existing: true,
        message: 'Ein Garment Pool mit dieser Eigenschaftskombination existiert bereits.'
      }, { status: 200 })
    }

    const pool = await prisma.blankGarment.create({
      data: {
        name,
        garmentType,
        attributes,
        canonicalKey,
        stock: typeof stock === 'number' ? stock : 0,
        notes: notes || null
      }
    })

    return NextResponse.json({ pool, created: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating garment pool:', error)
    return NextResponse.json({ error: 'Failed to create garment pool' }, { status: 500 })
  }
}
