import { NextRequest, NextResponse } from 'next/server'
import { checkDBHealth } from '@/lib/db'

// GET /api/health - Database health check
export async function GET(request: NextRequest) {
  try {
    const health = await checkDBHealth()
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json({
      success: health.status === 'healthy',
      ...health
    }, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}