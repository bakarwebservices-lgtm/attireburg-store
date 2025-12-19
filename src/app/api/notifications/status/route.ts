import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { NotificationService } from '@/lib/backorder'

const prisma = new PrismaClient()
const notificationService = new NotificationService(prisma)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notificationId')
    const action = searchParams.get('action') // 'open', 'click', 'purchase'

    if (notificationId && action) {
      // Track notification events
      switch (action) {
        case 'open':
          await notificationService.trackEmailOpen(notificationId)
          break
        case 'click':
          await notificationService.trackLinkClick(notificationId)
          break
        case 'purchase':
          await notificationService.trackPurchaseComplete(notificationId)
          break
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        message: `${action} event tracked`
      })
    } else {
      // Get notification analytics
      const analytics = await notificationService.getNotificationAnalytics()
      
      return NextResponse.json({
        analytics
      })
    }

  } catch (error) {
    console.error('Notification status error:', error)
    return NextResponse.json(
      { error: 'Failed to process notification status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle tracking pixel for email opens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Track email open
    await notificationService.trackEmailOpen(body.notificationId)

    return NextResponse.json({
      success: true,
      message: 'Email open tracked'
    })

  } catch (error) {
    console.error('Email tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track email open' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}