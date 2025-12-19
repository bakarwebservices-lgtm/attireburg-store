import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get customer subscriptions
    const subscriptions = await waitlistService.getCustomerSubscriptions(email)

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length
    })

  } catch (error) {
    console.error('Get waitlist subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist subscriptions' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}