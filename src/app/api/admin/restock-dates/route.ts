import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { RestockService } from '@/lib/backorder'

const prisma = new PrismaClient()
const restockService = new RestockService(prisma)

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
    const upcoming = searchParams.get('upcoming') === 'true'

    if (productId) {
      // Get restock date for specific product/variant
      const restockDate = await restockService.getRestockDate(
        productId,
        variantId || undefined
      )

      return NextResponse.json({
        productId,
        variantId: variantId || null,
        expectedRestockDate: restockDate
      })
    } else if (upcoming) {
      // Get all upcoming restocks
      const upcomingRestocks = await restockService.getUpcomingRestocks()
      
      return NextResponse.json({
        upcomingRestocks,
        count: upcomingRestocks.length
      })
    } else {
      // Get all upcoming restocks by default
      const upcomingRestocks = await restockService.getUpcomingRestocks()
      
      return NextResponse.json({
        upcomingRestocks,
        count: upcomingRestocks.length
      })
    }

  } catch (error) {
    console.error('Admin restock dates error:', error)
    return NextResponse.json(
      { error: 'Failed to get restock dates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    
    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Handle bulk updates
    if (Array.isArray(body.updates)) {
      const result = await restockService.bulkUpdateRestockDates(body.updates)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        updatedCount: result.updatedCount
      })
    } else {
      // Single update
      const result = await restockService.setRestockDate({
        productId: body.productId,
        variantId: body.variantId || undefined,
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
        notes: body.notes
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message
        })
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Admin restock date update error:', error)
    return NextResponse.json(
      { error: 'Failed to update restock date' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Clear restock date
    const result = await restockService.clearRestockDate(
      productId,
      variantId || undefined
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Admin restock date clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear restock date' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}