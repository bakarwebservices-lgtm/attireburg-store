// Environment configuration and validation
interface EnvironmentConfig {
  // App
  nodeEnv: 'development' | 'production' | 'test'
  baseUrl: string
  port: number
  
  // Database
  databaseUrl: string
  
  // Authentication
  jwtSecret: string
  
  // Payment
  paypal: {
    clientId: string
    clientSecret: string
    environment: 'sandbox' | 'production'
  }
  
  googlePay: {
    environment: 'TEST' | 'PRODUCTION'
    merchantId: string
    merchantName: string
  }
  
  // Email
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'resend'
    apiKey?: string
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPass?: string
    fromEmail: string
    fromName: string
  }
  
  // Features
  features: {
    enableBackorders: boolean
    enableWaitlist: boolean
    enableVariants: boolean
    enableAnalytics: boolean
  }
}

class EnvironmentService {
  private config: EnvironmentConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // App
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      port: parseInt(process.env.PORT || '3000'),
      
      // Database
      databaseUrl: process.env.DATABASE_URL || '',
      
      // Authentication
      jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
      
      // Payment
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
      },
      
      googlePay: {
        environment: (process.env.GOOGLE_PAY_ENVIRONMENT as 'TEST' | 'PRODUCTION') || 'TEST',
        merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || '',
        merchantName: process.env.GOOGLE_PAY_MERCHANT_NAME || 'Attireburg'
      },
      
      // Email
      email: {
        provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'mailgun' | 'resend') || 'smtp',
        apiKey: process.env.EMAIL_API_KEY,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        fromEmail: process.env.FROM_EMAIL || 'noreply@attireburg.com',
        fromName: process.env.FROM_NAME || 'Attireburg'
      },
      
      // Features
      features: {
        enableBackorders: process.env.ENABLE_BACKORDERS === 'true',
        enableWaitlist: process.env.ENABLE_WAITLIST === 'true',
        enableVariants: process.env.ENABLE_VARIANTS !== 'false', // Default to true
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true'
      }
    }
  }

  private validateConfig(): void {
    const errors: string[] = []

    // Required in production
    if (this.config.nodeEnv === 'production') {
      if (!this.config.databaseUrl) {
        errors.push('DATABASE_URL is required in production')
      }
      
      if (this.config.jwtSecret === 'dev-secret-key') {
        errors.push('JWT_SECRET must be set in production')
      }
      
      if (!this.config.paypal.clientId || !this.config.paypal.clientSecret) {
        errors.push('PayPal credentials are required in production')
      }
      
      if (this.config.email.provider !== 'smtp' && !this.config.email.apiKey) {
        errors.push('Email API key is required for non-SMTP providers')
      }
    }

    // Always required
    if (!this.config.baseUrl) {
      errors.push('NEXT_PUBLIC_BASE_URL is required')
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:')
      errors.forEach(error => console.error(`- ${error}`))
      
      if (this.config.nodeEnv === 'production') {
        throw new Error('Invalid production configuration')
      }
    }
  }

  get(): EnvironmentConfig {
    return this.config
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production'
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development'
  }

  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature]
  }

  getPaymentConfig() {
    return {
      paypal: this.config.paypal,
      googlePay: this.config.googlePay
    }
  }

  getEmailConfig() {
    return this.config.email
  }

  getDatabaseUrl(): string {
    return this.config.databaseUrl
  }

  getJWTSecret(): string {
    return this.config.jwtSecret
  }

  getBaseUrl(): string {
    return this.config.baseUrl
  }

  // Health check for deployment
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {}

    // Database check
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      checks.database = true
    } catch {
      checks.database = false
    }

    // Environment check
    checks.environment = this.config.nodeEnv !== undefined
    checks.baseUrl = !!this.config.baseUrl
    checks.jwtSecret = !!this.config.jwtSecret && this.config.jwtSecret !== 'dev-secret-key'

    // Payment checks
    checks.paypal = !!(this.config.paypal.clientId && this.config.paypal.clientSecret)
    checks.googlePay = !!this.config.googlePay.merchantId

    // Email check
    checks.email = !!(this.config.email.fromEmail)

    const allHealthy = Object.values(checks).every(check => check)

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    }
  }
}

export const environmentService = new EnvironmentService()
export type { EnvironmentConfig }