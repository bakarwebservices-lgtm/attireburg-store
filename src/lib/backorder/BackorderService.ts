import { PrismaClient } from '@prisma/client'

export interface BackorderData {
  userId: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    size: string
    color?: string
    price: number
  }>
  totalAmount: number
  currency: string
  shippingAddress: string
  shippingCity: string
  shippingPostal: string
  expectedFulfillmentDate?: Date
  paymentData?: {
    paypalOrderId?: string
    paypalPayerId?: string
  }
}

export interface BackorderInfo {
  id: string
  userId: string
  orderType: string
  status: string
  totalAmount: number
  currency: string
  expectedFulfillmentDate?: Date
  backorderPriority: number
  createdAt: Date
  items: Array<{
    id: string
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    quantity: number
    size: string
    color?: string
    price: number
  }>
}

export class BackorderService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Create a new backorder with payment processing integration
   */
  async createBackorder(data: BackorderData): Promise<{ success: boolean; orderId?: string; message: string }> {
    try {
      // Validate that all products exist and are out of stock
      for (const item of data.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          return {
            success: false,
            message: `Product ${item.productId} not found`
          }
        }

        // Check variant if specified
        if (item.variantId) {
          const variant = await this.prisma.productVariant.findUnique({
            where: { id: item.variantId }
          })

          if (!variant) {
            return {
              success: false,
              message: `Product variant ${item.variantId} not found`
            }
          }

          // Verify variant is out of stock
          if (variant.stock >= item.quantity) {
            return {
              success: false,
              message: `Product variant ${variant.sku} is in stock and cannot be backordered`
            }
          }
        } else {
          // Verify product is out of stock
          if (product.stock >= item.quantity) {
            return {
              success: false,
              message: `Product ${product.name} is in stock and cannot be backordered`
            }
          }
        }
      }

      // Get next priority number for FIFO fulfillment
      const lastBackorder = await this.prisma.order.findFirst({
        where: { orderType: 'backorder' },
        orderBy: { backorderPriority: 'desc' }
      })

      const nextPriority = (lastBackorder?.backorderPriority || 0) + 1

      // Create the backorder
      const order = await this.prisma.order.create({
        data: {
          userId: data.userId,
          status: 'PENDING',
          orderType: 'backorder',
          totalAmount: data.totalAmount,
          currency: data.currency,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingPostal: data.shippingPostal,
          expectedFulfillmentDate: data.expectedFulfillmentDate,
          backorderPriority: nextPriority,
          paypalOrderId: data.paymentData?.paypalOrderId,
          paypalPayerId: data.paymentData?.paypalPayerId,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price
            }))
          }
        }
      })

      return {
        success: true,
        orderId: order.id,
        message: 'Backorder created successfully'
      }

    } catch (error) {
      console.error('BackorderService.createBackorder error:', error)
      return {
        success: false,
        message: 'Failed to create backorder'
      }
    }
  }

  /**
   * Get pending backorders in FIFO order for fulfillment
   */
  async getPendingBackorders(productId?: string, variantId?: string): Promise<BackorderInfo[]> {
    try {
      const whereClause: any = {
        orderType: 'backorder',
        status: 'PENDING'
      }

      // Filter by product/variant if specified
      if (productId || variantId) {
        whereClause.items = {
          some: {
            productId: productId,
            variantId: variantId
          }
        }
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          backorderPriority: 'asc' // FIFO order
        }
      })

      return orders.map(order => ({
        id: order.id,
        userId: order.userId,
        orderType: order.orderType,
        status: order.status.toString(),
        totalAmount: order.totalAmount,
        currency: order.currency,
        expectedFulfillmentDate: order.expectedFulfillmentDate || undefined,
        backorderPriority: order.backorderPriority || 0,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          variantId: item.variantId || undefined,
          variantSku: item.variantId ? `Variant-${item.variantId}` : undefined,
          quantity: item.quantity,
          size: item.size,
          color: item.color || undefined,
          price: item.price
        }))
      }))

    } catch (error) {
      console.error('BackorderService.getPendingBackorders error:', error)
      return []
    }
  }

  /**
   * Cancel a backorder and process refund
   */
  async cancelBackorder(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!order) {
        return {
          success: false,
          message: 'Order not found'
        }
      }

      if (order.orderType !== 'backorder') {
        return {
          success: false,
          message: 'Order is not a backorder'
        }
      }

      if (order.status !== 'PENDING') {
        return {
          success: false,
          message: 'Order cannot be cancelled in current status'
        }
      }

      // Update order status to cancelled
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      })

      // TODO: Process refund through payment provider
      // This would integrate with PayPal or other payment systems

      return {
        success: true,
        message: 'Backorder cancelled successfully'
      }

    } catch (error) {
      console.error('BackorderService.cancelBackorder error:', error)
      return {
        success: false,
        message: 'Failed to cancel backorder'
      }
    }
  }

  /**
   * Fulfill backorders when inventory becomes available
   * Implements FIFO fulfillment logic
   */
  async fulfillBackorders(productId: string, availableQuantity: number, variantId?: string): Promise<{
    success: boolean
    fulfilledOrders: string[]
    remainingQuantity: number
    message: string
  }> {
    try {
      const pendingBackorders = await this.getPendingBackorders(productId, variantId)
      
      let remainingQuantity = availableQuantity
      const fulfilledOrders: string[] = []

      for (const backorder of pendingBackorders) {
        if (remainingQuantity <= 0) break

        // Find the specific item in this backorder
        const backorderItem = backorder.items.find(item => 
          item.productId === productId && 
          (variantId ? item.variantId === variantId : !item.variantId)
        )

        if (!backorderItem) continue

        if (backorderItem.quantity <= remainingQuantity) {
          // Can fulfill this entire backorder item
          await this.prisma.order.update({
            where: { id: backorder.id },
            data: {
              status: 'PROCESSING',
              updatedAt: new Date()
            }
          })

          fulfilledOrders.push(backorder.id)
          remainingQuantity -= backorderItem.quantity

          // TODO: Send fulfillment notification to customer
          // TODO: Trigger shipping process

        } else {
          // Partial fulfillment - would need to split the order
          // For now, we skip partial fulfillments to keep it simple
          break
        }
      }

      return {
        success: true,
        fulfilledOrders,
        remainingQuantity,
        message: `Fulfilled ${fulfilledOrders.length} backorders`
      }

    } catch (error) {
      console.error('BackorderService.fulfillBackorders error:', error)
      return {
        success: false,
        fulfilledOrders: [],
        remainingQuantity: availableQuantity,
        message: 'Failed to fulfill backorders'
      }
    }
  }

  /**
   * Get backorder status for a specific order
   */
  async getBackorderStatus(orderId: string): Promise<BackorderInfo | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        }
      })

      if (!order || order.orderType !== 'backorder') {
        return null
      }

      return {
        id: order.id,
        userId: order.userId,
        orderType: order.orderType,
        status: order.status.toString(),
        totalAmount: order.totalAmount,
        currency: order.currency,
        expectedFulfillmentDate: order.expectedFulfillmentDate || undefined,
        backorderPriority: order.backorderPriority || 0,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          variantId: item.variantId || undefined,
          variantSku: item.variantId ? `Variant-${item.variantId}` : undefined,
          quantity: item.quantity,
          size: item.size,
          color: item.color || undefined,
          price: item.price
        }))
      }

    } catch (error) {
      console.error('BackorderService.getBackorderStatus error:', error)
      return null
    }
  }

  /**
   * Get all backorders for a specific customer
   */
  async getCustomerBackorders(userId: string): Promise<BackorderInfo[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: {
          userId,
          orderType: 'backorder'
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return orders.map(order => ({
        id: order.id,
        userId: order.userId,
        orderType: order.orderType,
        status: order.status.toString(),
        totalAmount: order.totalAmount,
        currency: order.currency,
        expectedFulfillmentDate: order.expectedFulfillmentDate || undefined,
        backorderPriority: order.backorderPriority || 0,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          variantId: item.variantId || undefined,
          variantSku: item.variantId ? `Variant-${item.variantId}` : undefined,
          quantity: item.quantity,
          size: item.size,
          color: item.color || undefined,
          price: item.price
        }))
      }))

    } catch (error) {
      console.error('BackorderService.getCustomerBackorders error:', error)
      return []
    }
  }
}