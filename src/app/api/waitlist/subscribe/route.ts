import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.productId) {
      return NextResponse.json(
        { error: 'Email and product ID are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Subscribe to waitlist
    const result = await waitlistService.subscribe({
      email: body.email,
      productId: body.productId,
      variantId: body.variantId || undefined,
      userId: body.userId || undefined
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        subscriptionId: result.subscriptionId,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Waitlist subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to waitlist' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and product ID are required' },
        { status: 400 }
      )
    }

    // Check if subscribed
    const isSubscribed = await waitlistService.isSubscribed(
      email,
      productId,
      variantId || undefined
    )

    return NextResponse.json({
      isSubscribed,
      email,
      productId,
      variantId: variantId || null
    })

  } catch (error) {
    console.error('Waitlist check error:', error)
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}