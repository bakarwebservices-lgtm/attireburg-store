import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Non-admins can only see subscriptions for their own email
    const requestedEmail = new URL(request.url).searchParams.get('email')
    const email = user.isAdmin && requestedEmail ? requestedEmail : user.email

    const subscriptions = await waitlistService.getCustomerSubscriptions(email)

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length
    })
  } catch (error) {
    console.error('Get waitlist subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to get waitlist subscriptions' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}