import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WaitlistService } from '@/lib/backorder'

const prisma = new PrismaClient()
const waitlistService = new WaitlistService(prisma)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.productId) {
      return NextResponse.json(
        { error: 'Email and product ID are required' },
        { status: 400 }
      )
    }

    // Unsubscribe from waitlist
    const result = await waitlistService.unsubscribe(
      body.email,
      body.productId,
      body.variantId || undefined
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
    console.error('Waitlist unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from waitlist' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Support GET method for email link unsubscribes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')
    const token = searchParams.get('token')

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and product ID are required' },
        { status: 400 }
      )
    }

    // TODO: Validate unsubscribe token for security
    // For now, we'll allow unsubscribe without token validation

    // Unsubscribe from waitlist
    const result = await waitlistService.unsubscribe(
      email,
      productId,
      variantId || undefined
    )

    if (result.success) {
      // Return HTML page for email link clicks
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed - Attireburg</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: #28a745; }
            .container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Successfully Unsubscribed</h1>
            <p class="success">You have been successfully removed from the waitlist.</p>
            <p>You will no longer receive notifications for this product.</p>
            <a href="/">Return to Attireburg</a>
          </div>
        </body>
        </html>
      `
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    } else {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribe Error - Attireburg</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #dc3545; }
            .container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Unsubscribe Error</h1>
            <p class="error">${result.message}</p>
            <a href="/">Return to Attireburg</a>
          </div>
        </body>
        </html>
      `
      
      return new NextResponse(html, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

  } catch (error) {
    console.error('Waitlist unsubscribe error:', error)
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribe Error - Attireburg</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { color: #dc3545; }
          .container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Unsubscribe Error</h1>
          <p class="error">Failed to unsubscribe from waitlist</p>
          <a href="/">Return to Attireburg</a>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  } finally {
    await prisma.$disconnect()
  }
}