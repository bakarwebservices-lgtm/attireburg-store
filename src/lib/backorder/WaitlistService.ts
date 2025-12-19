import { PrismaClient } from '@prisma/client'

export interface WaitlistSubscriptionData {
  email: string
  productId: string
  variantId?: string
  userId?: string
}

export interface WaitlistAnalytics {
  totalSubscriptions: number
  activeSubscriptions: number
  subscriptionsByProduct: Array<{
    productId: string
    productName: string
    count: number
  }>
  subscriptionsByVariant: Array<{
    variantId: string
    variantSku: string
    count: number
  }>
}

export class WaitlistService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Subscribe a customer to a product waitlist
   * Handles email validation and duplicate subscription prevention
   */
  async subscribe(data: WaitlistSubscriptionData): Promise<{ success: boolean; subscriptionId?: string; message: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          message: 'Invalid email format'
        }
      }

      // Check if subscription already exists
      const existingSubscription = await this.prisma.waitlistSubscription.findUnique({
        where: {
          email_productId_variantId: {
            email: data.email,
            productId: data.productId,
            variantId: data.variantId || null
          }
        }
      })

      if (existingSubscription) {
        if (existingSubscription.isActive) {
          return {
            success: false,
            message: 'Already subscribed to this product waitlist'
          }
        } else {
          // Reactivate existing subscription
          const reactivated = await this.prisma.waitlistSubscription.update({
            where: { id: existingSubscription.id },
            data: { 
              isActive: true,
              updatedAt: new Date()
            }
          })

          return {
            success: true,
            subscriptionId: reactivated.id,
            message: 'Waitlist subscription reactivated'
          }
        }
      }

      // Verify product exists
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId }
      })

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        }
      }

      // Verify variant exists if specified
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

      // Create new subscription
      const subscription = await this.prisma.waitlistSubscription.create({
        data: {
          email: data.email,
          productId: data.productId,
          variantId: data.variantId || null,
          userId: data.userId || null,
          isActive: true
        }
      })

      return {
        success: true,
        subscriptionId: subscription.id,
        message: 'Successfully subscribed to waitlist'
      }

    } catch (error) {
      console.error('WaitlistService.subscribe error:', error)
      return {
        success: false,
        message: 'Failed to subscribe to waitlist'
      }
    }
  }

  /**
   * Remove a customer from a product waitlist
   */
  async unsubscribe(email: string, productId: string, variantId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.prisma.waitlistSubscription.findUnique({
        where: {
          email_productId_variantId: {
            email,
            productId,
            variantId: variantId || null
          }
        }
      })

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        }
      }

      await this.prisma.waitlistSubscription.update({
        where: { id: subscription.id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        message: 'Successfully unsubscribed from waitlist'
      }

    } catch (error) {
      console.error('WaitlistService.unsubscribe error:', error)
      return {
        success: false,
        message: 'Failed to unsubscribe from waitlist'
      }
    }
  }

  /**
   * Get all active subscriptions for a customer
   */
  async getCustomerSubscriptions(email: string): Promise<Array<{
    id: string
    productId: string
    productName: string
    productNameEn: string
    variantId?: string
    variantSku?: string
    expectedRestockDate?: Date
    createdAt: Date
  }>> {
    try {
      const subscriptions = await this.prisma.waitlistSubscription.findMany({
        where: {
          email,
          isActive: true
        },
        include: {
          product: {
            select: {
              name: true,
              nameEn: true
            }
          },
          variant: {
            select: {
              sku: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Get restock dates for each subscription
      const subscriptionsWithDates = await Promise.all(
        subscriptions.map(async (sub) => {
          const restockSchedule = await this.prisma.restockSchedule.findUnique({
            where: {
              productId_variantId: {
                productId: sub.productId,
                variantId: sub.variantId
              }
            }
          })

          return {
            id: sub.id,
            productId: sub.productId,
            productName: sub.product.name,
            productNameEn: sub.product.nameEn,
            variantId: sub.variantId || undefined,
            variantSku: sub.variant?.sku,
            expectedRestockDate: restockSchedule?.expectedDate || undefined,
            createdAt: sub.createdAt
          }
        })
      )

      return subscriptionsWithDates

    } catch (error) {
      console.error('WaitlistService.getCustomerSubscriptions error:', error)
      return []
    }
  }

  /**
   * Get all active subscriptions for a specific product/variant
   */
  async getProductSubscriptions(productId: string, variantId?: string): Promise<Array<{
    id: string
    email: string
    userId?: string
    createdAt: Date
  }>> {
    try {
      const subscriptions = await this.prisma.waitlistSubscription.findMany({
        where: {
          productId,
          variantId: variantId || null,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          userId: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc' // FIFO order for notifications
        }
      })

      return subscriptions

    } catch (error) {
      console.error('WaitlistService.getProductSubscriptions error:', error)
      return []
    }
  }

  /**
   * Generate waitlist analytics for admin dashboard
   */
  async getAnalytics(): Promise<WaitlistAnalytics> {
    try {
      const totalSubscriptions = await this.prisma.waitlistSubscription.count()
      const activeSubscriptions = await this.prisma.waitlistSubscription.count({
        where: { isActive: true }
      })

      // Get subscriptions by product
      const productSubscriptions = await this.prisma.waitlistSubscription.groupBy({
        by: ['productId'],
        where: { isActive: true },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      const subscriptionsByProduct = await Promise.all(
        productSubscriptions.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          })

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            count: item._count.id
          }
        })
      )

      // Get subscriptions by variant
      const variantSubscriptions = await this.prisma.waitlistSubscription.groupBy({
        by: ['variantId'],
        where: { 
          isActive: true,
          variantId: { not: null }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      const subscriptionsByVariant = await Promise.all(
        variantSubscriptions.map(async (item) => {
          if (!item.variantId) return null

          const variant = await this.prisma.productVariant.findUnique({
            where: { id: item.variantId },
            select: { sku: true }
          })

          return {
            variantId: item.variantId,
            variantSku: variant?.sku || 'Unknown Variant',
            count: item._count.id
          }
        })
      )

      return {
        totalSubscriptions,
        activeSubscriptions,
        subscriptionsByProduct,
        subscriptionsByVariant: subscriptionsByVariant.filter(Boolean) as Array<{
          variantId: string
          variantSku: string
          count: number
        }>
      }

    } catch (error) {
      console.error('WaitlistService.getAnalytics error:', error)
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        subscriptionsByProduct: [],
        subscriptionsByVariant: []
      }
    }
  }

  /**
   * Check if a customer is subscribed to a product waitlist
   */
  async isSubscribed(email: string, productId: string, variantId?: string): Promise<boolean> {
    try {
      const subscription = await this.prisma.waitlistSubscription.findUnique({
        where: {
          email_productId_variantId: {
            email,
            productId,
            variantId: variantId || null
          }
        }
      })

      return subscription?.isActive || false

    } catch (error) {
      console.error('WaitlistService.isSubscribed error:', error)
      return false
    }
  }
}