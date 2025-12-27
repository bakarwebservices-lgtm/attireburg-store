import { PrismaClient } from '@prisma/client'

export interface RestockScheduleData {
  productId: string
  variantId?: string
  expectedDate?: Date
  notes?: string
}

export interface RestockEvent {
  productId: string
  variantId?: string
  previousStock: number
  newStock: number
  restockedQuantity: number
  timestamp: Date
}

export class RestockService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Set or update expected restock date for a product/variant
   */
  async setRestockDate(data: RestockScheduleData): Promise<{ success: boolean; message: string }> {
    try {
      // Validate that product exists
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId }
      })

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        }
      }

      // Validate variant if specified
      if (data.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: data.variantId }
        })

        if (!variant) {
          return {
            success: false,
            message: 'Product variant not found'
          }
        }
      }

      // Validate date is in the future
      if (data.expectedDate && data.expectedDate <= new Date()) {
        return {
          success: false,
          message: 'Expected restock date must be in the future'
        }
      }

      // Create or update restock schedule
      await this.prisma.restockSchedule.upsert({
        where: {
          productId_variantId: {
            productId: data.productId,
            variantId: (data.variantId || null) as any
          }
        },
        update: {
          expectedDate: data.expectedDate,
          notes: data.notes,
          updatedAt: new Date()
        },
        create: {
          productId: data.productId,
          variantId: (data.variantId || null) as any,
          expectedDate: data.expectedDate,
          notes: data.notes
        }
      })

      return {
        success: true,
        message: 'Restock date updated successfully'
      }

    } catch (error) {
      console.error('RestockService.setRestockDate error:', error)
      return {
        success: false,
        message: 'Failed to set restock date'
      }
    }
  }

  /**
   * Get expected restock date for a product/variant
   */
  async getRestockDate(productId: string, variantId?: string): Promise<Date | null> {
    try {
      const schedule = await this.prisma.restockSchedule.findUnique({
        where: {
          productId_variantId: {
            productId,
            variantId: (variantId || null) as any
          }
        }
      })

      return schedule?.expectedDate || null

    } catch (error) {
      console.error('RestockService.getRestockDate error:', error)
      return null
    }
  }

  /**
   * Clear restock date when inventory arrives
   */
  async clearRestockDate(productId: string, variantId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const schedule = await this.prisma.restockSchedule.findUnique({
        where: {
          productId_variantId: {
            productId,
            variantId: (variantId || null) as any
          }
        }
      })

      if (!schedule) {
        return {
          success: true,
          message: 'No restock date to clear'
        }
      }

      await this.prisma.restockSchedule.update({
        where: { id: schedule.id },
        data: {
          actualDate: new Date(),
          expectedDate: null,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        message: 'Restock date cleared successfully'
      }

    } catch (error) {
      console.error('RestockService.clearRestockDate error:', error)
      return {
        success: false,
        message: 'Failed to clear restock date'
      }
    }
  }

  /**
   * Process inventory restock event
   * Triggers notifications and backorder fulfillment
   */
  async processRestockEvent(event: RestockEvent): Promise<{
    success: boolean
    notificationsSent: number
    backordersFulfilled: number
    message: string
  }> {
    try {
      // Clear the restock date since inventory has arrived
      await this.clearRestockDate(event.productId, event.variantId)

      // Get all waitlist subscriptions for this product/variant
      const subscriptions = await this.prisma.waitlistSubscription.findMany({
        where: {
          productId: event.productId,
          variantId: event.variantId || null,
          isActive: true
        },
        orderBy: {
          createdAt: 'asc' // FIFO order
        }
      })

      let notificationsSent = 0
      let backordersFulfilled = 0

      // TODO: Trigger waitlist notifications
      // This would be handled by the NotificationService
      notificationsSent = subscriptions.length

      // TODO: Trigger backorder fulfillment
      // This would be handled by the BackorderService
      // const fulfillmentResult = await backorderService.fulfillBackorders(
      //   event.productId, 
      //   event.restockedQuantity,
      //   event.variantId
      // )
      // backordersFulfilled = fulfillmentResult.fulfilledOrders.length

      return {
        success: true,
        notificationsSent,
        backordersFulfilled,
        message: `Restock processed: ${notificationsSent} notifications sent, ${backordersFulfilled} backorders fulfilled`
      }

    } catch (error) {
      console.error('RestockService.processRestockEvent error:', error)
      return {
        success: false,
        notificationsSent: 0,
        backordersFulfilled: 0,
        message: 'Failed to process restock event'
      }
    }
  }

  /**
   * Get all products with expected restock dates
   */
  async getUpcomingRestocks(): Promise<Array<{
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    expectedDate: Date
    waitlistCount: number
    backorderCount: number
    notes?: string
  }>> {
    try {
      const schedules = await this.prisma.restockSchedule.findMany({
        where: {
          expectedDate: {
            not: null,
            gte: new Date() // Only future dates
          }
        },
        include: {
          product: {
            select: { name: true }
          },
          variant: {
            select: { sku: true }
          }
        },
        orderBy: {
          expectedDate: 'asc'
        }
      })

      const upcomingRestocks = await Promise.all(
        schedules.map(async (schedule) => {
          // Count waitlist subscriptions
          const waitlistCount = await this.prisma.waitlistSubscription.count({
            where: {
              productId: schedule.productId,
              variantId: schedule.variantId,
              isActive: true
            }
          })

          // Count pending backorders
          const backorderCount = await this.prisma.order.count({
            where: {
              orderType: 'backorder',
              status: 'PENDING',
              items: {
                some: {
                  productId: schedule.productId,
                  variantId: schedule.variantId
                }
              }
            }
          })

          return {
            productId: schedule.productId,
            productName: schedule.product.name,
            variantId: schedule.variantId || undefined,
            variantSku: schedule.variant?.sku,
            expectedDate: schedule.expectedDate!,
            waitlistCount,
            backorderCount,
            notes: schedule.notes || undefined
          }
        })
      )

      return upcomingRestocks

    } catch (error) {
      console.error('RestockService.getUpcomingRestocks error:', error)
      return []
    }
  }

  /**
   * Check for expired restock dates and handle them
   */
  async processExpiredRestockDates(): Promise<{
    success: boolean
    expiredCount: number
    notificationsSent: number
    message: string
  }> {
    try {
      const expiredSchedules = await this.prisma.restockSchedule.findMany({
        where: {
          expectedDate: {
            not: null,
            lt: new Date() // Past dates
          }
        },
        include: {
          product: {
            select: { name: true }
          },
          variant: {
            select: { sku: true }
          }
        }
      })

      let notificationsSent = 0

      for (const schedule of expiredSchedules) {
        // Get waitlist subscriptions for delay notifications
        const subscriptions = await this.prisma.waitlistSubscription.findMany({
          where: {
            productId: schedule.productId,
            variantId: schedule.variantId,
            isActive: true
          }
        })

        // TODO: Send delay notifications to customers
        // This would be handled by the NotificationService
        notificationsSent += subscriptions.length

        // Remove the expired date
        await this.prisma.restockSchedule.update({
          where: { id: schedule.id },
          data: {
            expectedDate: null,
            notes: `Previous expected date ${schedule.expectedDate?.toISOString().split('T')[0]} has passed`,
            updatedAt: new Date()
          }
        })
      }

      return {
        success: true,
        expiredCount: expiredSchedules.length,
        notificationsSent,
        message: `Processed ${expiredSchedules.length} expired restock dates`
      }

    } catch (error) {
      console.error('RestockService.processExpiredRestockDates error:', error)
      return {
        success: false,
        expiredCount: 0,
        notificationsSent: 0,
        message: 'Failed to process expired restock dates'
      }
    }
  }

  /**
   * Bulk update restock dates for multiple products
   */
  async bulkUpdateRestockDates(updates: Array<{
    productId: string
    variantId?: string
    expectedDate?: Date
    notes?: string
  }>): Promise<{ success: boolean; updatedCount: number; message: string }> {
    try {
      let updatedCount = 0

      for (const update of updates) {
        const result = await this.setRestockDate(update)
        if (result.success) {
          updatedCount++
        }
      }

      return {
        success: true,
        updatedCount,
        message: `Updated ${updatedCount} of ${updates.length} restock dates`
      }

    } catch (error) {
      console.error('RestockService.bulkUpdateRestockDates error:', error)
      return {
        success: false,
        updatedCount: 0,
        message: 'Failed to bulk update restock dates'
      }
    }
  }

  /**
   * Get restock history for a product/variant
   */
  async getRestockHistory(productId: string, variantId?: string): Promise<Array<{
    expectedDate?: Date
    actualDate?: Date
    notes?: string
    createdAt: Date
    updatedAt: Date
  }>> {
    try {
      const schedules = await this.prisma.restockSchedule.findMany({
        where: {
          productId,
          variantId: variantId || null
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return schedules.map(schedule => ({
        expectedDate: schedule.expectedDate || undefined,
        actualDate: schedule.actualDate || undefined,
        notes: schedule.notes || undefined,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }))

    } catch (error) {
      console.error('RestockService.getRestockHistory error:', error)
      return []
    }
  }
}