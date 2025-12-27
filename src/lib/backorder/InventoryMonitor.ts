import { PrismaClient } from '@prisma/client'
import { BackorderService } from './BackorderService'
import { RestockService } from './RestockService'
import { NotificationService } from './NotificationService'
import { WaitlistService } from './WaitlistService'

export interface InventoryUpdateEvent {
  productId: string
  variantId?: string
  previousStock: number
  newStock: number
  updateType: 'manual' | 'automatic' | 'restock'
}

export class InventoryMonitor {
  private prisma: PrismaClient
  private backorderService: BackorderService
  private restockService: RestockService
  private notificationService: NotificationService
  private waitlistService: WaitlistService

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.backorderService = new BackorderService(prisma)
    this.restockService = new RestockService(prisma)
    this.notificationService = new NotificationService(prisma)
    this.waitlistService = new WaitlistService(prisma)
  }

  /**
   * Process inventory update and trigger automatic fulfillment
   */
  async processInventoryUpdate(event: InventoryUpdateEvent): Promise<{
    success: boolean
    backordersFulfilled: number
    notificationsSent: number
    message: string
  }> {
    try {
      let backordersFulfilled = 0
      let notificationsSent = 0

      // Only process if stock increased (items became available)
      if (event.newStock > event.previousStock) {
        const restockedQuantity = event.newStock - event.previousStock

        // 1. Clear restock date since inventory arrived
        await this.restockService.clearRestockDate(event.productId, event.variantId)

        // 2. Fulfill pending backorders (FIFO order)
        const fulfillmentResult = await this.backorderService.fulfillBackorders(
          event.productId,
          restockedQuantity,
          event.variantId
        )

        if (fulfillmentResult.success) {
          backordersFulfilled = fulfillmentResult.fulfilledOrders.length

          // Send fulfillment notifications for fulfilled backorders
          for (const orderId of fulfillmentResult.fulfilledOrders) {
            const backorder = await this.backorderService.getBackorderStatus(orderId)
            if (backorder) {
              // Get user email for notification
              const user = await this.prisma.user.findUnique({
                where: { id: backorder.userId },
                select: { email: true }
              })

              if (user?.email) {
                await this.notificationService.sendFulfillmentNotification({
                  email: user.email,
                  orderNumber: backorder.id.slice(-8).toUpperCase(),
                  trackingNumber: undefined, // Would be set by shipping system
                  estimatedDelivery: undefined // Would be calculated based on shipping method
                })
              }
            }
          }
        }

        // 3. Send restock notifications to waitlist subscribers
        const waitlistSubscriptions = await this.waitlistService.getProductSubscriptions(
          event.productId,
          event.variantId
        )

        // Group notifications by email for consolidation
        const notificationsByEmail = new Map<string, any[]>()

        for (const subscription of waitlistSubscriptions) {
          if (!notificationsByEmail.has(subscription.email)) {
            notificationsByEmail.set(subscription.email, [])
          }

          // Get product details for notification
          const product = await this.prisma.product.findUnique({
            where: { id: event.productId },
            select: { name: true, nameEn: true, price: true, salePrice: true }
          })

          let variant = null
          if (event.variantId) {
            variant = await this.prisma.productVariant.findUnique({
              where: { id: event.variantId },
              select: { sku: true, price: true, salePrice: true }
            })
          }

          if (product) {
            const notificationData = {
              email: subscription.email,
              productName: product.name,
              productNameEn: product.nameEn,
              productId: event.productId,
              variantId: event.variantId,
              variantSku: variant?.sku,
              currentPrice: variant?.salePrice || variant?.price || product.salePrice || product.price,
              currency: 'EUR',
              purchaseUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products/${event.productId}`,
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/waitlist/unsubscribe?email=${encodeURIComponent(subscription.email)}&productId=${event.productId}&variantId=${event.variantId || ''}`
            }

            notificationsByEmail.get(subscription.email)!.push(notificationData)
          }
        }

        // Send notifications (consolidated when possible)
        for (const [email, notifications] of notificationsByEmail) {
          if (notifications.length === 1) {
            // Single notification
            await this.notificationService.sendRestockNotification(
              waitlistSubscriptions.find(s => s.email === email)!.id,
              notifications[0]
            )
          } else {
            // Consolidated notification
            await this.notificationService.sendConsolidatedNotifications(email, notifications)
          }
          notificationsSent += notifications.length
        }
      }

      return {
        success: true,
        backordersFulfilled,
        notificationsSent,
        message: `Processed inventory update: ${backordersFulfilled} backorders fulfilled, ${notificationsSent} notifications sent`
      }

    } catch (error) {
      console.error('InventoryMonitor.processInventoryUpdate error:', error)
      return {
        success: false,
        backordersFulfilled: 0,
        notificationsSent: 0,
        message: 'Failed to process inventory update'
      }
    }
  }

  /**
   * Monitor for inventory changes and trigger automatic processing
   */
  async monitorInventoryChanges(): Promise<void> {
    // This would typically be called by a webhook or scheduled job
    // when inventory is updated in the system
    
    // For now, this is a placeholder that could be extended to:
    // 1. Listen to database changes (using triggers or change streams)
    // 2. Process webhook notifications from inventory management systems
    // 3. Run as a scheduled job to check for inventory updates
    
    console.log('Inventory monitoring service started')
  }

  /**
   * Manually trigger restock processing for a specific product/variant
   */
  async triggerRestockProcessing(
    productId: string,
    variantId?: string,
    newStock?: number
  ): Promise<{
    success: boolean
    backordersFulfilled: number
    notificationsSent: number
    message: string
  }> {
    try {
      // Get current stock if not provided
      let currentStock = newStock
      if (currentStock === undefined) {
        if (variantId) {
          const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            select: { stock: true }
          })
          currentStock = variant?.stock || 0
        } else {
          const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { stock: true }
          })
          currentStock = product?.stock || 0
        }
      }

      // Simulate inventory update event
      const event: InventoryUpdateEvent = {
        productId,
        variantId,
        previousStock: 0, // Assume it was out of stock
        newStock: currentStock || 0,
        updateType: 'manual'
      }

      return await this.processInventoryUpdate(event)

    } catch (error) {
      console.error('InventoryMonitor.triggerRestockProcessing error:', error)
      return {
        success: false,
        backordersFulfilled: 0,
        notificationsSent: 0,
        message: 'Failed to trigger restock processing'
      }
    }
  }

  /**
   * Get inventory monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    totalBackorders: number
    pendingBackorders: number
    totalWaitlistSubscriptions: number
    activeWaitlistSubscriptions: number
    outOfStockProducts: number
  }> {
    try {
      const [
        totalBackorders,
        pendingBackorders,
        totalWaitlistSubscriptions,
        activeWaitlistSubscriptions,
        outOfStockProducts
      ] = await Promise.all([
        this.prisma.order.count({
          where: { orderType: 'backorder' }
        }),
        this.prisma.order.count({
          where: { 
            orderType: 'backorder',
            status: 'PENDING'
          }
        }),
        this.prisma.waitlistSubscription.count(),
        this.prisma.waitlistSubscription.count({
          where: { isActive: true }
        }),
        this.prisma.product.count({
          where: { stock: 0 }
        })
      ])

      return {
        totalBackorders,
        pendingBackorders,
        totalWaitlistSubscriptions,
        activeWaitlistSubscriptions,
        outOfStockProducts
      }

    } catch (error) {
      console.error('InventoryMonitor.getMonitoringStats error:', error)
      return {
        totalBackorders: 0,
        pendingBackorders: 0,
        totalWaitlistSubscriptions: 0,
        activeWaitlistSubscriptions: 0,
        outOfStockProducts: 0
      }
    }
  }

  /**
   * Process expired restock dates and send delay notifications
   */
  async processExpiredRestockDates(): Promise<{
    success: boolean
    expiredCount: number
    notificationsSent: number
    message: string
  }> {
    try {
      const result = await this.restockService.processExpiredRestockDates()
      
      // The RestockService handles the basic processing,
      // but we could add additional logic here for delay notifications
      
      return {
        success: result.success,
        expiredCount: result.expiredCount,
        notificationsSent: result.notificationsSent,
        message: result.message
      }

    } catch (error) {
      console.error('InventoryMonitor.processExpiredRestockDates error:', error)
      return {
        success: false,
        expiredCount: 0,
        notificationsSent: 0,
        message: 'Failed to process expired restock dates'
      }
    }
  }
}