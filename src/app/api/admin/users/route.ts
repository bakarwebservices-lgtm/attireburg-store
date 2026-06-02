import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all'

    const where: any = {}
    if (filter === 'admin') where.isAdmin = true
    if (filter === 'customers') where.isAdmin = false
    if (filter === 'active') where.isActive = true
    if (filter === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        country: true,
        isAdmin: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      city: u.city,
      country: u.country,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      lastLogin: u.lastLogin?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
      totalOrders: u._count.orders,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    }))

    return NextResponse.json({ users: formatted })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Toggle admin / active status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = verifyToken(token)
    if (!currentUser || !currentUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, isAdmin, isActive } = await request.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const data: any = {}
    if (typeof isAdmin === 'boolean') data.isAdmin = isAdmin
    if (typeof isActive === 'boolean') data.isActive = isActive

    const user = await prisma.user.update({ where: { id: userId }, data })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
