import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { NotificationService, WaitlistService } from '@/lib/backorder'

const prisma = new PrismaClient()
const notificationService = new NotificationService(prisma)
const waitlistService = new WaitlistService(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get product information
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: {
        variants: body.variantId ? {
          where: { id: body.variantId }
        } : undefined
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get waitlist subscriptions for this product/variant
    const subscriptions = await waitlistService.getProductSubscriptions(
      body.productId,
      body.variantId
    )

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for this product',
        notificationsSent: 0
      })
    }

    // Group subscriptions by email for consolidation
    const subscriptionsByEmail = new Map<string, typeof subscriptions>()
    
    for (const subscription of subscriptions) {
      const existing = subscriptionsByEmail.get(subscription.email) || []
      existing.push(subscription)
      subscriptionsByEmail.set(subscription.email, existing)
    }

    let totalNotificationsSent = 0
    let successfulNotifications = 0

    // Send notifications
    for (const [email, emailSubscriptions] of subscriptionsByEmail) {
      try {
        // Prepare notification data
        const notifications = emailSubscriptions.map(sub => ({
          email: sub.email,
          productName: product.name,
          productNameEn: product.nameEn,
          productId: body.productId,
          variantId: body.variantId || undefined,
          variantSku: product.variants?.[0]?.sku,
          currentPrice: body.variantId ? (product.variants?.[0]?.price || product.price) : product.price,
          currency: product.currency,
          purchaseUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products/${body.productId}`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/waitlist/unsubscribe?email=${encodeURIComponent(email)}&productId=${body.productId}&variantId=${body.variantId || ''}`
        }))

        if (notifications.length === 1) {
          // Single notification
          const subscription = await prisma.waitlistSubscription.findUnique({
            where: {
              email_productId_variantId: {
                email,
                productId: body.productId,
                variantId: body.variantId || null
              }
            }
          })

          if (subscription) {
            const result = await notificationService.sendRestockNotification(
              subscription.id,
              notifications[0]
            )
            
            if (result.success) {
              successfulNotifications++
            }
          }
        } else {
          // Consolidated notifications
          const result = await notificationService.sendConsolidatedNotifications(
            email,
            notifications
          )
          
          if (result.success) {
            successfulNotifications++
          }
        }

        totalNotificationsSent++

      } catch (notificationError) {
        console.error(`Failed to send notification to ${email}:`, notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successfulNotifications} of ${totalNotificationsSent} notifications`,
      notificationsSent: successfulNotifications,
      totalSubscriptions: subscriptions.length
    })

  } catch (error) {
    console.error('Restock notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send restock notifications' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}