import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// GET /api/test-db - Test database connection
export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()
  
  // Debug: show what URL is being used (mask password)
  const dbUrl = process.env.DATABASE_URL || 'NOT SET'
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':***@')
  
  try {
    console.log('🔍 Testing database connection...')
    console.log('🔗 Using URL:', maskedUrl)
    
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as test`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ])
    
    console.log('✅ Database connected!')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      url: maskedUrl,
      result
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        url: maskedUrl,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}