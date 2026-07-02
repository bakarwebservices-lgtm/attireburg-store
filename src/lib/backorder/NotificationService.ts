import { emailService } from '@/lib/email/EmailService'

export class NotificationService {
  private prisma: any

  constructor(prisma: any) {
    this.prisma = prisma
  }

  async sendRestockNotifications(notifications: any[]): Promise<any> {
    let sent = 0
    let failed = 0
    
    for (const notif of notifications) {
      try {
        const res = await this.sendRestockNotification(notif.subscriptionId, notif)
        if (res.success) {
          sent++
        } else {
          failed++
        }
      } catch (err) {
        failed++
      }
    }
    
    return {
      success: true,
      sent,
      failed,
      message: `Processed ${sent} successful, ${failed} failed restock notifications`
    }
  }

  async sendDelayNotifications(subscriptions: any[]): Promise<any> {
    return {
      success: true,
      sent: 0,
      failed: 0,
      message: 'Delay notifications not implemented'
    }
  }

  async sendBackorderFulfillmentNotifications(orders: any[]): Promise<any> {
    return {
      success: true,
      sent: 0,
      failed: 0,
      message: 'Fulfillment notifications not implemented'
    }
  }

  async sendFulfillmentNotification(data: any): Promise<any> {
    return {
      success: true,
      message: 'Fulfillment notifications not implemented'
    }
  }

  async sendRestockNotification(id: string, data: any): Promise<any> {
    try {
      const result = await emailService.sendRestockNotification({
        customerName: data.email.split('@')[0],
        customerEmail: data.email,
        productName: data.productName,
        productUrl: data.purchaseUrl,
        unsubscribeUrl: data.unsubscribeUrl
      })

      if (result) {
        // Create restock notification log in database
        await this.prisma.restockNotification.create({
          data: {
            waitlistSubscriptionId: id,
            sentAt: new Date()
          }
        })

        // Deactivate the subscription after notifying
        await this.prisma.waitlistSubscription.update({
          where: { id },
          data: { isActive: false }
        })
      }

      return { success: !!result }
    } catch (error) {
      console.error('NotificationService.sendRestockNotification error:', error)
      return { success: false, error }
    }
  }

  async sendConsolidatedNotifications(email: string, notifications: any[]): Promise<any> {
    try {
      let successCount = 0
      for (const notification of notifications) {
        const subscription = await this.prisma.waitlistSubscription.findFirst({
          where: {
            email,
            productId: notification.productId,
            variantId: notification.variantId || null,
            isActive: true
          }
        })

        if (subscription) {
          const result = await this.sendRestockNotification(subscription.id, notification)
          if (result.success) {
            successCount++
          }
        }
      }
      return { success: successCount > 0, sentCount: successCount }
    } catch (error) {
      console.error('NotificationService.sendConsolidatedNotifications error:', error)
      return { success: false, error }
    }
  }

  async trackEmailOpen(notificationId: string): Promise<any> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { emailOpened: true }
      })
      return { success: true }
    } catch (error) {
      console.error('NotificationService.trackEmailOpen error:', error)
      return { success: false }
    }
  }

  async trackLinkClick(notificationId: string): Promise<any> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { linkClicked: true }
      })
      return { success: true }
    } catch (error) {
      console.error('NotificationService.trackLinkClick error:', error)
      return { success: false }
    }
  }

  async trackPurchaseComplete(notificationId: string): Promise<any> {
    try {
      await this.prisma.restockNotification.update({
        where: { id: notificationId },
        data: { purchaseCompleted: true }
      })
      return { success: true }
    } catch (error) {
      console.error('NotificationService.trackPurchaseComplete error:', error)
      return { success: false }
    }
  }

  async getNotificationAnalytics(): Promise<any> {
    try {
      const totalSent = await this.prisma.restockNotification.count()
      const totalOpen = await this.prisma.restockNotification.count({
        where: { emailOpened: true }
      })
      const totalClick = await this.prisma.restockNotification.count({
        where: { linkClicked: true }
      })
      const totalPurchase = await this.prisma.restockNotification.count({
        where: { purchaseCompleted: true }
      })

      return {
        totalSent,
        openRate: totalSent > 0 ? (totalOpen / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClick / totalSent) * 100 : 0,
        conversionRate: totalSent > 0 ? (totalPurchase / totalSent) * 100 : 0
      }
    } catch (error) {
      console.error('NotificationService.getNotificationAnalytics error:', error)
      return {
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      }
    }
  }
}