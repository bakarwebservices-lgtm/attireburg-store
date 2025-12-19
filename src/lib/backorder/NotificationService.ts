import { PrismaClient } from '@prisma/client'

export interface NotificationTemplate {
  type: 'restock' | 'delay' | 'fulfillment'
  subject: string
  htmlContent: string
  textContent: string
}

export interface RestockNotificationData {
  email: string
  productName: string
  productNameEn: string
  productId: string
  variantId?: string
  variantSku?: string
  currentPrice: number
  currency: string
  purchaseUrl: string
  unsubscribeUrl: string
}

export interface DelayNotificationData {
  email: string
  productName: string
  productNameEn: string
  orderNumber: string
  originalDate: Date
  newDate?: Date
  cancellationUrl: string
}

export interface FulfillmentNotificationData {
  email: string
  orderNumber: string
  trackingNumber?: string
  estimatedDelivery?: Date
}

export class NotificationService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Send restock notification to waitlisted customers
   */
  async sendRestockNotification(
    waitlistSubscriptionId: string,
    data: RestockNotificationData
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify subscription exists and is active
      const subscription = await this.prisma.waitlistSubscription.findUnique({
        where: { id: waitlistSubscriptionId }
      })

      if (!subscription || !subscription.isActive) {
        return {
          success: false,
          message: 'Subscription not found or inactive'
        }
      }

      // Create temporary reservation for purchase link
      const reservationToken = await this.createTemporaryReservation(
        data.productId,
        data.variantId,
        data.email
      )

      // Generate notification template
      const template = this.generateRestockTemplate(data, reservationToken)

      // TODO: Send email using email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate email sending
      const emailSent = await this.sendEmail(data.email, template)

      if (emailSent) {
        // Record the notification
        await this.prisma.restockNotification.create({
          data: {
            waitlistSubscriptionId,
            sentAt: new Date(),
            emailOpened: false,
            linkClicked: false,
            purchaseCompleted: false
          }
        })

        return {
          success: true,
          message: 'Restock notification sent successfully'
        }
      } else {
        return {
          success: false,
          message: 'Failed to send email notification'
        }
      }

    } catch (error) {
      console.error('NotificationService.sendRestockNotification error:', error)
      return {
        success: false,
        message: 'Failed to send restock notification'
      }
    }
  }

  /**
   * Send delay notification for backorders
   */
  async sendDelayNotification(data: DelayNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      const template = this.generateDelayTemplate(data)
      const emailSent = await this.sendEmail(data.email, template)

      return {
        success: emailSent,
        message: emailSent ? 'Delay notification sent successfully' : 'Failed to send delay notification'
      }

    } catch (error) {
      console.error('NotificationService.sendDelayNotification error:', error)
      return {
        success: false,
        message: 'Failed to send delay notification'
      }
    }
  }

  /**
   * Send fulfillment notification
   */
  async sendFulfillmentNotification(data: FulfillmentNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      const template = this.generateFulfillmentTemplate(data)
      const emailSent = await this.sendEmail(data.email, template)

      return {
        success: emailSent,
        message: emailSent ? 'Fulfillment notification sent successfully' : 'Failed to send fulfillment notification'
      }

    } catch (error) {
      console.error('NotificationService.sendFulfillmentNotification error:', error)
      return {
        success: false,
        message: 'Failed to send fulfillment notification'
      }
    }
  }

  /**
   * Send consolidated notifications for multiple items
   */
  async sendConsolidatedNotifications(
    email: string,
    notifications: RestockNotificationData[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (notifications.length === 0) {
        return { success: true, message: 'No notifications to send' }
      }

      if (notifications.length === 1) {
        // Single notification - find the subscription ID
        const subscription = await this.prisma.waitlistSubscription.findUnique({
          where: {
            email_productId_variantId: {
              email,
              productId: notifications[0].productId,
              variantId: notifications[0].variantId || null
            }
          }
        })

        if (subscription) {
          return await this.sendRestockNotification(subscription.id, notifications[0])
        }
      }

      // Multiple notifications - consolidate into one email
      const template = this.generateConsolidatedTemplate(email, notifications)
      const emailSent = await this.sendEmail(email, template)

      if (emailSent) {
        // Record notifications for all subscriptions
        for (const notification of notifications) {
          const subscription = await this.prisma.waitlistSubscription.findUnique({
            where: {
              email_productId_variantId: {
                email,
                productId: notification.productId,
                variantId: notification.variantId || null
              }
            }
          })

          if (subscription) {
            await this.prisma.restockNotification.create({
              data: {
                waitlistSubscriptionId: subscription.id,
                sentAt: new Date(),
                emailOpened: false,
                linkClicked: false,
                purchaseCompleted: false
              }
            })
          }
        }
      }

      return {
        success: emailSent,
        message: emailSent ? 'Consolidated notifications sent successfully' : 'Failed to send consolidated notifications'
      }

    } catch (error) {
      console.error('NotificationService.sendConsolidatedNotifications error:', error)
      return {
        success: false,
        message: 'Failed to send consolidated notifications'
      }
    }
  }

  /**
   * Create temporary reservation for notification purchase links
   */
  private async createTemporaryReservation(
    productId: string,
    variantId: string | undefined,
    email: string
  ): Promise<string> {
    // Generate a unique reservation token
    const token = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // TODO: Store reservation in cache/database with 30-minute expiration
    // For now, we'll just return the token
    
    return token
  }

  /**
   * Generate restock notification email template
   */
  private generateRestockTemplate(data: RestockNotificationData, reservationToken: string): NotificationTemplate {
    const subject = `${data.productName} is back in stock!`
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Great news! Your waitlisted item is back in stock</h2>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <h3>${data.productName}</h3>
          ${data.variantSku ? `<p><strong>SKU:</strong> ${data.variantSku}</p>` : ''}
          <p><strong>Price:</strong> ${data.currentPrice} ${data.currency}</p>
          
          <a href="${data.purchaseUrl}?token=${reservationToken}" 
             style="background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
            Purchase Now (Reserved for 30 minutes)
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This item has been reserved for you for 30 minutes. After that, it will be available to other customers.
        </p>
        
        <p style="color: #666; font-size: 12px;">
          Don't want these notifications? 
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    `
    
    const textContent = `
      ${data.productName} is back in stock!
      
      ${data.variantSku ? `SKU: ${data.variantSku}` : ''}
      Price: ${data.currentPrice} ${data.currency}
      
      Purchase now: ${data.purchaseUrl}?token=${reservationToken}
      (Reserved for 30 minutes)
      
      Unsubscribe: ${data.unsubscribeUrl}
    `

    return {
      type: 'restock',
      subject,
      htmlContent,
      textContent
    }
  }

  /**
   * Generate delay notification email template
   */
  private generateDelayTemplate(data: DelayNotificationData): NotificationTemplate {
    const subject = `Update on your backorder #${data.orderNumber}`
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Backorder Update</h2>
        
        <p>We have an update regarding your backorder for <strong>${data.productName}</strong>.</p>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Original Expected Date:</strong> ${data.originalDate.toDateString()}</p>
          ${data.newDate ? 
            `<p><strong>New Expected Date:</strong> ${data.newDate.toDateString()}</p>` :
            `<p><strong>Status:</strong> We're working to determine a new expected date</p>`
          }
        </div>
        
        <p>We apologize for any inconvenience. If you'd like to cancel your backorder, you can do so at any time:</p>
        
        <a href="${data.cancellationUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
          Cancel Backorder
        </a>
        
        <p style="color: #666; font-size: 14px;">
          Thank you for your patience and continued business.
        </p>
      </div>
    `
    
    const textContent = `
      Backorder Update - Order #${data.orderNumber}
      
      Product: ${data.productName}
      Original Expected Date: ${data.originalDate.toDateString()}
      ${data.newDate ? 
        `New Expected Date: ${data.newDate.toDateString()}` :
        `Status: We're working to determine a new expected date`
      }
      
      Cancel backorder: ${data.cancellationUrl}
    `

    return {
      type: 'delay',
      subject,
      htmlContent,
      textContent
    }
  }

  /**
   * Generate fulfillment notification email template
   */
  private generateFulfillmentTemplate(data: FulfillmentNotificationData): NotificationTemplate {
    const subject = `Your backorder #${data.orderNumber} has shipped!`
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Your order has shipped!</h2>
        
        <p>Great news! Your backorder has been fulfilled and is on its way to you.</p>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          ${data.trackingNumber ? 
            `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''
          }
          ${data.estimatedDelivery ? 
            `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery.toDateString()}</p>` : ''
          }
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Thank you for your patience with your backorder. We hope you love your purchase!
        </p>
      </div>
    `
    
    const textContent = `
      Your backorder #${data.orderNumber} has shipped!
      
      ${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
      ${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery.toDateString()}` : ''}
      
      Thank you for your patience!
    `

    return {
      type: 'fulfillment',
      subject,
      htmlContent,
      textContent
    }
  }

  /**
   * Generate consolidated notification template for multiple items
   */
  private generateConsolidatedTemplate(email: string, notifications: RestockNotificationData[]): NotificationTemplate {
    const subject = `${notifications.length} items from your waitlist are back in stock!`
    
    const itemsHtml = notifications.map(item => `
      <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
        <h4>${item.productName}</h4>
        ${item.variantSku ? `<p><strong>SKU:</strong> ${item.variantSku}</p>` : ''}
        <p><strong>Price:</strong> ${item.currentPrice} ${item.currency}</p>
        <a href="${item.purchaseUrl}" 
           style="background-color: #8B4513; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Purchase Now
        </a>
      </div>
    `).join('')
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Multiple items from your waitlist are back in stock!</h2>
        
        <p>Great news! ${notifications.length} items you've been waiting for are now available:</p>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          ${itemsHtml}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          These items are in limited stock and may sell out quickly.
        </p>
        
        <p style="color: #666; font-size: 12px;">
          Don't want these notifications? 
          <a href="${notifications[0].unsubscribeUrl}">Manage your waitlist subscriptions</a>
        </p>
      </div>
    `
    
    const itemsText = notifications.map(item => 
      `${item.productName}${item.variantSku ? ` (${item.variantSku})` : ''} - ${item.currentPrice} ${item.currency}\n${item.purchaseUrl}`
    ).join('\n\n')
    
    const textContent = `
      ${notifications.length} items from your waitlist are back in stock!
      
      ${itemsText}
      
      Manage subscriptions: ${notifications[0].unsubscribeUrl}
    `

    return {
      type: 'restock',
      subject,
      htmlContent,
      textContent
    }
  }

  /**
   * Simulate email sending (replace with actual email service)
   */
  private async sendEmail(email: string, template: NotificationTemplate): Promise<boolean> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      console.log(`Sending ${template.type} notification to ${email}`)
      console.log(`Subject: ${template.subject}`)
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Simulate 95% success rate
      return Math.random() > 0.05

    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  /**
   * Track email open events
   */
  async trackEmailOpen(notificationId: string): Promise<void> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { emailOpened: true }
      })
    } catch (error) {
      console.error('Failed to track email open:', error)
    }
  }

  /**
   * Track link click events
   */
  async trackLinkClick(notificationId: string): Promise<void> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { linkClicked: true }
      })
    } catch (error) {
      console.error('Failed to track link click:', error)
    }
  }

  /**
   * Track purchase completion events
   */
  async trackPurchaseComplete(notificationId: string): Promise<void> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { purchaseCompleted: true }
      })
    } catch (error) {
      console.error('Failed to track purchase completion:', error)
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(): Promise<{
    totalSent: number
    openRate: number
    clickRate: number
    conversionRate: number
  }> {
    try {
      const totalSent = await this.prisma.restockNotification.count()
      const opened = await this.prisma.restockNotification.count({
        where: { emailOpened: true }
      })
      const clicked = await this.prisma.restockNotification.count({
        where: { linkClicked: true }
      })
      const converted = await this.prisma.restockNotification.count({
        where: { purchaseCompleted: true }
      })

      return {
        totalSent,
        openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
        conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0
      }

    } catch (error) {
      console.error('Failed to get notification analytics:', error)
      return {
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      }
    }
  }
}