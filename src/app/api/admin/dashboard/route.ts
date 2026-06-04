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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      recentOrders,
      topProductsRaw,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

    // Enrich top products with names/images
    const productIds = topProductsRaw.map(p => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true },
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    const topProducts = topProductsRaw.map(p => ({
      id: p.productId,
      name: productMap[p.productId]?.name || 'Unbekannt',
      image: productMap[p.productId]?.images?.[0] || '',
      sales: p._sum.quantity || 0,
      revenue: (p._sum.price || 0) * (p._sum.quantity || 0),
    }))

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: `ATB-${o.id.slice(-6).toUpperCase()}`,
        customerName: o.user.name,
        total: o.totalAmount,
        status: o.status,
        date: o.createdAt.toISOString().split('T')[0],
      })),
      topProducts,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
