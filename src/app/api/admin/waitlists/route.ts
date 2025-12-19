import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

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
    const analytics = searchParams.get('analytics') === 'true'

    if (analytics) {
      // Get waitlist analytics
      const analyticsData = await waitlistService.getAnalytics()
      
      return NextResponse.json({
        analytics: analyticsData
      })
    } else if (productId) {
      // Get subscriptions for specific product/variant
      const subscriptions = await waitlistService.getProductSubscriptions(
        productId,
        variantId || undefined
      )

      return NextResponse.json({
        subscriptions,
        count: subscriptions.length,
        productId,
        variantId: variantId || null
      })
    } else {
      // Get general waitlist analytics
      const analyticsData = await waitlistService.getAnalytics()
      
      return NextResponse.json({
        analytics: analyticsData
      })
    }

  } catch (error) {
    console.error('Admin waitlists error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}