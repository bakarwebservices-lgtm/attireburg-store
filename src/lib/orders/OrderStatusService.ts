// Order status management service
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email/EmailService'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

interface OrderStatusUpdate {
  orderId: string
  status: OrderStatus
  trackingNumber?: string
  notes?: string
  notifyCustomer?: boolean
}

interface OrderStatusHistory {
  id: string
  orderId: string
  status: OrderStatus
  notes?: string
  createdAt: Date
  createdBy?: string
}

class OrderStatusService {
  private readonly statusTransitions: Record<OrderStatus, OrderStatus[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': ['REFUNDED'],
    'CANCELLED': [],
    'REFUNDED': []
  }

  private readonly statusLabels: Record<OrderStatus, { de: string; en: string }> = {
    'PENDING': { de: 'Ausstehend', en: 'Pending' },
    'CONFIRMED': { de: 'Bestätigt', en: 'Confirmed' },
    'PROCESSING': { de: 'In Bearbeitung', en: 'Processing' },
    'SHIPPED': { de: 'Versandt', en: 'Shipped' },
    'DELIVERED': { de: 'Zugestellt', en: 'Delivered' },
    'CANCELLED': { de: 'Storniert', en: 'Cancelled' },
    'REFUNDED': { de: 'Erstattet', en: 'Refunded' }
  }

  async updateOrderStatus(update: OrderStatusUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current order
      const order = await prisma.order.findUnique({
        where: { id: update.orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      // Validate status transition
      const currentStatus = order.status as OrderStatus
      const allowedTransitions = this.statusTransitions[currentStatus]
      
      if (!allowedTransitions.includes(update.status)) {
        return { 
          success: false, 
          error: `Invalid status transition from ${currentStatus} to ${update.status}` 
        }
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: update.orderId },
        data: {
          status: update.status,
          ...(update.trackingNumber && { trackingNumber: update.trackingNumber }),
          updatedAt: new Date()
        }
      })

      // Create status history entry
      await this.createStatusHistory({
        orderId: update.orderId,
        status: update.status,
        notes: update.notes
      })

      // Send customer notification if requested
      if (update.notifyCustomer) {
        await this.sendStatusNotification(order, update.status, update.trackingNumber)
      }

      // Handle specific status actions
      await this.handleStatusActions(order, update.status)

      return { success: true }
    } catch (error) {
      console.error('Order status update failed:', error)
      return { success: false, error: 'Failed to update order status' }
    }
  }

  private async createStatusHistory(history: Omit<OrderStatusHistory, 'id' | 'createdAt'>): Promise<void> {
    try {
      // For now, we'll log the status history
      // In production, you might want to store this in a separate table
      console.log('Order Status History:', {
        ...history,
        createdAt: new Date(),
        id: `hist_${Date.now()}`
      })
    } catch (error) {
      console.error('Failed to create status history:', error)
    }
  }

  private async sendStatusNotification(order: any, status: OrderStatus, trackingNumber?: string): Promise<void> {
    try {
      const orderNumber = `ATB-${order.id.slice(-6).toUpperCase()}`
      const customerName = this.extractCustomerName(order.shippingAddress)
      
      // Extract email from shipping address or use a default
      const emailMatch = order.shippingAddress.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const customerEmail = emailMatch ? emailMatch[1] : 'customer@example.com'

      switch (status) {
        case 'CONFIRMED':
          // Order confirmation is already sent during order creation
          break
        case 'SHIPPED':
          await emailService.sendShippingNotification(
            orderNumber,
            customerEmail,
            customerName,
            trackingNumber
          )
          break
        case 'DELIVERED':
          // Could send delivery confirmation
          break
        case 'CANCELLED':
          // Could send cancellation notification
          break
      }
    } catch (error) {
      console.error('Failed to send status notification:', error)
    }
  }

  private async handleStatusActions(order: any, status: OrderStatus): Promise<void> {
    switch (status) {
      case 'CANCELLED':
        // Restore inventory
        await this.restoreInventory(order)
        break
      case 'SHIPPED':
        // Could integrate with shipping providers
        break
      case 'DELIVERED':
        // Could trigger review request emails
        break
    }
  }

  private async restoreInventory(order: any): Promise<void> {
    try {
      for (const item of order.items) {
        if (item.variantId) {
          // Restore variant inventory
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        } else {
          // Restore product inventory
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to restore inventory:', error)
    }
  }

  private extractCustomerName(shippingAddress: string): string {
    const lines = shippingAddress.split('\n')
    return lines[0] || 'Kunde'
  }

  async getOrderStatus(orderId: string): Promise<{ status: OrderStatus; label: string } | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true }
      })

      if (!order) return null

      const status = order.status as OrderStatus
      return {
        status,
        label: this.statusLabels[status].de
      }
    } catch (error) {
      console.error('Failed to get order status:', error)
      return null
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<any[]> {
    try {
      return await prisma.order.findMany({
        where: { status },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get orders by status:', error)
      return []
    }
  }

  getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
    return this.statusTransitions[currentStatus] || []
  }

  getStatusLabel(status: OrderStatus, language: 'de' | 'en' = 'de'): string {
    return this.statusLabels[status][language]
  }

  getAllStatuses(): Array<{ status: OrderStatus; label: string }> {
    return Object.entries(this.statusLabels).map(([status, labels]) => ({
      status: status as OrderStatus,
      label: labels.de
    }))
  }
}

export const orderStatusService = new OrderStatusService()
export type { OrderStatusUpdate, OrderStatusHistory }