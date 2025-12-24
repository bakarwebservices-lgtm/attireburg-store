// Error logging and monitoring service
interface ErrorLog {
  id: string
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
}

class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  log(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>, error?: Error): void {
    const logEntry: ErrorLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      stack: error?.stack,
      context,
      userId: context?.userId,
      sessionId: context?.sessionId,
      userAgent: context?.userAgent,
      url: context?.url
    }

    // Add to memory store
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console output
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    logMethod(`[${level.toUpperCase()}] ${message}`, context || '', error?.stack || '')

    // In production, you would send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry)
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  private async sendToExternalService(logEntry: ErrorLog): Promise<void> {
    try {
      // In production, integrate with services like:
      // - Sentry
      // - LogRocket
      // - DataDog
      // - CloudWatch
      
      // For now, just log to console in production
      if (logEntry.level === 'error') {
        console.error('PRODUCTION ERROR:', JSON.stringify(logEntry, null, 2))
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  getLogs(level?: 'error' | 'warn' | 'info', limit = 100): ErrorLog[] {
    let filteredLogs = this.logs
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level)
    }
    
    return filteredLogs.slice(0, limit)
  }

  getErrorStats(): { total: number; errors: number; warnings: number; info: number } {
    const stats = {
      total: this.logs.length,
      errors: 0,
      warnings: 0,
      info: 0
    }

    this.logs.forEach(log => {
      switch (log.level) {
        case 'error':
          stats.errors++
          break
        case 'warn':
          stats.warnings++
          break
        case 'info':
          stats.info++
          break
      }
    })

    return stats
  }

  clearLogs(): void {
    this.logs = []
  }

  // Helper method for API error logging
  logAPIError(endpoint: string, method: string, error: Error, context?: Record<string, any>): void {
    this.error(`API Error: ${method} ${endpoint}`, {
      endpoint,
      method,
      ...context
    }, error)
  }

  // Helper method for payment error logging
  logPaymentError(paymentMethod: string, orderId: string, error: Error, context?: Record<string, any>): void {
    this.error(`Payment Error: ${paymentMethod}`, {
      paymentMethod,
      orderId,
      ...context
    }, error)
  }

  // Helper method for database error logging
  logDatabaseError(operation: string, table: string, error: Error, context?: Record<string, any>): void {
    this.error(`Database Error: ${operation} on ${table}`, {
      operation,
      table,
      ...context
    }, error)
  }
}

export const errorLogger = new ErrorLogger()
export type { ErrorLog }