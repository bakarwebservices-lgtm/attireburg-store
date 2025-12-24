import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { environmentService } from '@/lib/config/environment'
import { prisma } from '@/lib/prisma'

interface ProductionCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  required: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const checks: ProductionCheck[] = []
    const config = environmentService.get()

    // Environment checks
    checks.push({
      name: 'Environment Configuration',
      status: config.nodeEnv === 'production' ? 'pass' : 'warning',
      message: `Environment: ${config.nodeEnv}`,
      required: false
    })

    checks.push({
      name: 'JWT Secret Security',
      status: config.jwtSecret !== 'dev-secret-key' && config.jwtSecret.length >= 32 ? 'pass' : 'fail',
      message: config.jwtSecret === 'dev-secret-key' ? 'Using default JWT secret' : `JWT secret length: ${config.jwtSecret.length}`,
      required: true
    })

    checks.push({
      name: 'Base URL Configuration',
      status: config.baseUrl.startsWith('https://') ? 'pass' : 'warning',
      message: `Base URL: ${config.baseUrl}`,
      required: false
    })

    // Database checks
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.push({
        name: 'Database Connection',
        status: 'pass',
        message: 'Database connection successful',
        required: true
      })

      // Check if we have products
      const productCount = await prisma.product.count()
      checks.push({
        name: 'Product Catalog',
        status: productCount > 0 ? 'pass' : 'warning',
        message: `${productCount} products in catalog`,
        required: false
      })

      // Check if we have admin users
      const adminCount = await prisma.user.count({ where: { isAdmin: true } })
      checks.push({
        name: 'Admin Users',
        status: adminCount > 0 ? 'pass' : 'fail',
        message: `${adminCount} admin users configured`,
        required: true
      })
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Database connection failed',
        required: true
      })
    }

    // Payment checks
    checks.push({
      name: 'PayPal Configuration',
      status: config.paypal.clientId && config.paypal.clientSecret ? 'pass' : 'fail',
      message: config.paypal.clientId ? `Environment: ${config.paypal.environment}` : 'PayPal credentials missing',
      required: true
    })

    checks.push({
      name: 'Google Pay Configuration',
      status: config.googlePay.merchantId ? 'pass' : 'warning',
      message: config.googlePay.merchantId ? `Environment: ${config.googlePay.environment}` : 'Google Pay not configured',
      required: false
    })

    // Email checks
    checks.push({
      name: 'Email Configuration',
      status: config.email.fromEmail && (config.email.apiKey || config.email.smtpHost) ? 'pass' : 'warning',
      message: `Provider: ${config.email.provider}, From: ${config.email.fromEmail}`,
      required: false
    })

    // Feature checks
    checks.push({
      name: 'Core Features',
      status: 'pass',
      message: `Variants: ${config.features.enableVariants}, Backorders: ${config.features.enableBackorders}, Waitlist: ${config.features.enableWaitlist}`,
      required: false
    })

    // Security checks
    checks.push({
      name: 'HTTPS Configuration',
      status: config.baseUrl.startsWith('https://') ? 'pass' : 'fail',
      message: config.baseUrl.startsWith('https://') ? 'HTTPS enabled' : 'HTTPS not configured',
      required: true
    })

    // Calculate overall status
    const failedRequired = checks.filter(c => c.required && c.status === 'fail').length
    const totalWarnings = checks.filter(c => c.status === 'warning').length
    const totalPassed = checks.filter(c => c.status === 'pass').length

    let overallStatus: 'ready' | 'not-ready' | 'ready-with-warnings'
    if (failedRequired > 0) {
      overallStatus = 'not-ready'
    } else if (totalWarnings > 0) {
      overallStatus = 'ready-with-warnings'
    } else {
      overallStatus = 'ready'
    }

    return NextResponse.json({
      status: overallStatus,
      summary: {
        total: checks.length,
        passed: totalPassed,
        warnings: totalWarnings,
        failed: checks.filter(c => c.status === 'fail').length,
        requiredFailed: failedRequired
      },
      checks,
      recommendations: generateRecommendations(checks),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Production check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateRecommendations(checks: ProductionCheck[]): string[] {
  const recommendations: string[] = []
  
  const failedChecks = checks.filter(c => c.status === 'fail')
  const warningChecks = checks.filter(c => c.status === 'warning')

  if (failedChecks.length > 0) {
    recommendations.push('❌ Fix all failed checks before deploying to production')
    failedChecks.forEach(check => {
      recommendations.push(`  • ${check.name}: ${check.message}`)
    })
  }

  if (warningChecks.length > 0) {
    recommendations.push('⚠️ Consider addressing these warnings:')
    warningChecks.forEach(check => {
      recommendations.push(`  • ${check.name}: ${check.message}`)
    })
  }

  if (failedChecks.length === 0 && warningChecks.length === 0) {
    recommendations.push('✅ All checks passed! Your application is ready for production.')
    recommendations.push('📋 Final steps:')
    recommendations.push('  • Test payment flows with real transactions')
    recommendations.push('  • Verify email delivery')
    recommendations.push('  • Set up monitoring and alerts')
    recommendations.push('  • Configure backup procedures')
  }

  return recommendations
}