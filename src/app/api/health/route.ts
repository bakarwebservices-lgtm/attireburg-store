import { NextRequest, NextResponse } from 'next/server'
import { checkDBHealth } from '@/lib/db'
import { environmentService } from '@/lib/config/environment'

// GET /api/health - Comprehensive health check
export async function GET(request: NextRequest) {
  try {
    const [dbHealth, envHealth] = await Promise.all([
      checkDBHealth(),
      environmentService.healthCheck()
    ])
    
    const overallStatus = dbHealth.status === 'healthy' && envHealth.status === 'healthy' 
      ? 'healthy' 
      : 'unhealthy'
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    return NextResponse.json({
      success: overallStatus === 'healthy',
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: environmentService.get().nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealth.status === 'healthy',
        ...envHealth.checks
      },
      details: {
        database: dbHealth,
        environment: envHealth
      }
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