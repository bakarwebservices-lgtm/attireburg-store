import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BackorderService } from '@/lib/backorder'

const prisma = new PrismaClient()
const backorderService = new BackorderService(prisma)

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (status === 'PENDING') {
      // Get pending backorders for fulfillment
      const pendingBackorders = await backorderService.getPendingBackorders(
        productId || undefined,
        variantId || undefined
      )

      // Apply pagination
      const skip = (page - 1) * limit
      const paginatedBackorders = pendingBackorders.slice(skip, skip + limit)

      return NextResponse.json({
        backorders: paginatedBackorders,
        pagination: {
          page,
          limit,
          total: pendingBackorders.length,
          pages: Math.ceil(pendingBackorders.length / limit)
        }
      })
    } else {
      // Get all backorders with filters
      const whereClause: any = {
        orderType: 'backorder'
      }

      if (status !== 'ALL') {
        whereClause.status = status
      }

      if (productId || variantId) {
        whereClause.items = {
          some: {
            productId: productId,
            variantId: variantId
          }
        }
      }

      const skip = (page - 1) * limit

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            },
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: {
            backorderPriority: 'asc'
          },
          skip,
          take: limit
        }),
        prisma.order.count({ where: whereClause })
      ])

      const backorders = orders.map(order => ({
        id: order.id,
        userId: order.userId,
        user: order.user,
        orderType: order.orderType,
        status: order.status.toString(),
        totalAmount: order.totalAmount,
        currency: order.currency,
        expectedFulfillmentDate: order.expectedFulfillmentDate,
        backorderPriority: order.backorderPriority || 0,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          variantId: item.variantId,
          variantSku: item.variantId ? `Variant-${item.variantId}` : undefined,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price
        }))
      }))

      return NextResponse.json({
        backorders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    }

  } catch (error) {
    console.error('Admin backorders error:', error)
    return NextResponse.json(
      { error: 'Failed to get backorders' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}