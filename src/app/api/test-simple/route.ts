import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test 1: Basic response
    console.log('🔍 Test 1: Basic endpoint working')
    
    // Test 2: Database connection
    await prisma.$connect()
    console.log('🔍 Test 2: Database connected')
    
    // Test 3: Simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('🔍 Test 3: Query result:', result)
    
    // Test 4: Count tables
    const userCount = await prisma.user.count()
    console.log('🔍 Test 4: User count:', userCount)
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed!',
      tests: {
        connection: 'OK',
        query: result,
        userCount
      }
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}