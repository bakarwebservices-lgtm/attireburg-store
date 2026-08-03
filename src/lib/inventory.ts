// Inventory management service for products and variants
import { prisma } from './prisma'
import { InventoryMonitor } from './backorder'

export interface InventoryItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface InventoryResult {
  success: boolean
  errors: string[]
  updatedItems: InventoryItem[]
}

export interface StockInfo {
  productId: string
  variantId?: string
  currentStock: number
  available: boolean
}

class InventoryService {
  private inventoryMonitor: InventoryMonitor

  constructor() {
    this.inventoryMonitor = new InventoryMonitor(prisma)
  }
  /**
   * Check stock availability for multiple items (supporting optional checkoutId to ignore customer's own hold)
   */
  async checkStock(items: InventoryItem[], checkoutId?: string): Promise<StockInfo[]> {
    const stockInfo: StockInfo[] = []

    for (const item of items) {
      try {
        if (item.variantId) {
          const [variant, product] = await Promise.all([
            prisma.productVariant.findUnique({
              where: { id: item.variantId },
              select: { stock: true, isActive: true, blankGarmentId: true }
            }),
            prisma.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, isActive: true }
            })
          ])

          if (variant?.blankGarmentId) {
            const pool = await prisma.blankGarment.findUnique({
              where: { id: variant.blankGarmentId },
              select: { stock: true, isActive: true }
            })

            const activeReservations = await prisma.poolReservation.aggregate({
              where: {
                blankGarmentId: variant.blankGarmentId,
                expiresAt: { gt: new Date() },
                ...(checkoutId ? { checkoutId: { not: checkoutId } } : {})
              },
              _sum: { quantity: true }
            })

            const poolStock = pool?.stock || 0
            const reserved = activeReservations._sum.quantity || 0
            const availableStock = Math.max(0, poolStock - reserved)
            const isAvailable = (variant?.isActive && product?.isActive && pool?.isActive && availableStock >= item.quantity) || false

            stockInfo.push({
              productId: item.productId,
              variantId: item.variantId,
              currentStock: availableStock,
              available: isAvailable
            })
          } else {
            const combinedStock = variant?.stock || 0
            const isAvailable = (variant?.isActive && product?.isActive && combinedStock >= item.quantity) || false

            stockInfo.push({
              productId: item.productId,
              variantId: item.variantId,
              currentStock: combinedStock,
              available: isAvailable
            })
          }
        } else {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, isActive: true }
          })

          stockInfo.push({
            productId: item.productId,
            currentStock: product?.stock || 0,
            available: (product?.isActive && (product?.stock || 0) >= item.quantity) || false
          })
        }
      } catch (error) {
        console.error(`Error checking stock for ${item.productId}:`, error)
        stockInfo.push({
          productId: item.productId,
          variantId: item.variantId,
          currentStock: 0,
          available: false
        })
      }
    }

    return stockInfo
  }

  /**
   * Reserve inventory for items (decrease stock) - supports checkoutId for clearing reservations
   */
  async reserveInventory(items: InventoryItem[], checkoutId?: string): Promise<InventoryResult> {
    const result: InventoryResult = {
      success: true,
      errors: [],
      updatedItems: []
    }

    const stockInfo = await this.checkStock(items, checkoutId)
    const unavailableItems = stockInfo.filter(info => !info.available)

    if (unavailableItems.length > 0) {
      result.success = false
      result.errors = unavailableItems.map(item => 
        `Insufficient stock for product ${item.productId}${item.variantId ? ` variant ${item.variantId}` : ''}: ${item.currentStock} available`
      )
      return result
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { blankGarmentId: true }
            })

            if (variant?.blankGarmentId) {
              await tx.blankGarment.update({
                where: { id: variant.blankGarmentId },
                data: { stock: { decrement: item.quantity } }
              })

              if (checkoutId) {
                await tx.poolReservation.deleteMany({
                  where: { checkoutId, blankGarmentId: variant.blankGarmentId }
                })
              }

              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                  stickerStock: { decrement: item.quantity }
                }
              })
            } else {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } }
              })
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                  stickerStock: { decrement: item.quantity }
                }
              })
            }
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                stickerStock: { decrement: item.quantity }
              }
            })
          }
          
          result.updatedItems.push(item)
        }
      })
    } catch (error) {
      console.error('Error reserving inventory:', error)
      result.success = false
      result.errors.push('Failed to reserve inventory: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }

    return result
  }

  /**
   * Restore inventory for items (increase stock) - used for cancellations and returns
   */
  async restoreInventory(items: InventoryItem[]): Promise<InventoryResult> {
    const result: InventoryResult = {
      success: true,
      errors: [],
      updatedItems: []
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { blankGarmentId: true }
            })

            if (variant?.blankGarmentId) {
              await tx.blankGarment.update({
                where: { id: variant.blankGarmentId },
                data: { stock: { increment: item.quantity } }
              })
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { increment: item.quantity },
                  stickerStock: { increment: item.quantity }
                }
              })
            } else {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              })
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { increment: item.quantity },
                  stickerStock: { increment: item.quantity }
                }
              })
            }
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                stickerStock: { increment: item.quantity }
              }
            })
          }
          
          result.updatedItems.push(item)
        }
      })
    } catch (error) {
      console.error('Error restoring inventory:', error)
      result.success = false
      result.errors.push('Failed to restore inventory: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }

    return result
  }

  /**
   * Get current stock levels for a product and its variants
   */
  async getProductStock(productId: string): Promise<{
    productStock: number
    variants: Array<{ id: string; sku: string; stock: number; attributes: any; blankGarmentId?: string | null }>
    totalVariantStock: number
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          stock: true,
          variants: {
            select: {
              id: true,
              sku: true,
              stock: true,
              attributes: true,
              isActive: true,
              blankGarmentId: true,
              blankGarment: {
                select: { stock: true }
              }
            },
            where: { isActive: true }
          }
        }
      })

      if (!product) {
        return {
          productStock: 0,
          variants: [],
          totalVariantStock: 0
        }
      }

      const mappedVariants = product.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        attributes: v.attributes,
        blankGarmentId: v.blankGarmentId,
        stock: v.blankGarmentId && v.blankGarment ? v.blankGarment.stock : v.stock
      }))

      const totalVariantStock = mappedVariants.reduce((sum, variant) => sum + variant.stock, 0)

      return {
        productStock: product.stock,
        variants: mappedVariants,
        totalVariantStock
      }
    } catch (error) {
      console.error('Error getting product stock:', error)
      return {
        productStock: 0,
        variants: [],
        totalVariantStock: 0
      }
    }
  }

  /**
   * Get low stock alerts (products, unlinked variants, low-stock pools, and orphaned pools)
   */
  async getLowStockAlerts(threshold: number = 5): Promise<{
    products: Array<{ id: string; name: string; stock: number }>
    variants: Array<{ id: string; productId: string; sku: string; stock: number; attributes: any }>
    pools: Array<{ id: string; name: string; garmentType: string; stock: number }>
    orphanedPools: Array<{ id: string; name: string; garmentType: string; stock: number }>
  }> {
    try {
      const [lowStockProducts, lowStockVariants, lowStockPools, orphanedPools] = await Promise.all([
        prisma.product.findMany({
          where: {
            stock: { lte: threshold },
            isActive: true
          },
          select: { id: true, name: true, stock: true }
        }),
        prisma.productVariant.findMany({
          where: {
            blankGarmentId: null,
            stock: { lte: threshold },
            isActive: true
          },
          select: {
            id: true,
            productId: true,
            sku: true,
            stock: true,
            attributes: true
          }
        }),
        prisma.blankGarment.findMany({
          where: {
            stock: { lte: threshold },
            isActive: true
          },
          select: { id: true, name: true, garmentType: true, stock: true }
        }),
        prisma.blankGarment.findMany({
          where: {
            stock: { gt: 0 },
            isActive: true,
            linkedVariants: {
              none: { isActive: true }
            }
          },
          select: { id: true, name: true, garmentType: true, stock: true }
        })
      ])

      return {
        products: lowStockProducts,
        variants: lowStockVariants,
        pools: lowStockPools,
        orphanedPools
      }
    } catch (error) {
      console.error('Error getting low stock alerts:', error)
      return {
        products: [],
        variants: [],
        pools: [],
        orphanedPools: []
      }
    }
  }

  /**
   * Update inventory and trigger backorder processing
   */
  async updateInventoryWithBackorderProcessing(
    productId: string,
    variantId: string | undefined,
    newStock: number,
    updateType: 'manual' | 'automatic' | 'restock' = 'manual'
  ): Promise<{
    success: boolean
    previousStock: number
    newStock: number
    backordersFulfilled: number
    notificationsSent: number
    message: string
  }> {
    try {
      // Get current stock
      let previousStock = 0
      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          select: { stock: true }
        })
        previousStock = variant?.stock || 0
      } else {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { stock: true }
        })
        previousStock = product?.stock || 0
      }

      // Update the stock
      if (variantId) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: newStock }
        })
      } else {
        await prisma.product.update({
          where: { id: productId },
          data: { stock: newStock }
        })
      }

      // Process backorder fulfillment if stock increased
      let backordersFulfilled = 0
      let notificationsSent = 0

      if (newStock > previousStock) {
        const result = await this.inventoryMonitor.processInventoryUpdate({
          productId,
          variantId,
          previousStock,
          newStock,
          updateType
        })

        if (result.success) {
          backordersFulfilled = result.backordersFulfilled
          notificationsSent = result.notificationsSent
        }
      }

      return {
        success: true,
        previousStock,
        newStock,
        backordersFulfilled,
        notificationsSent,
        message: `Inventory updated: ${backordersFulfilled} backorders fulfilled, ${notificationsSent} notifications sent`
      }

    } catch (error) {
      console.error('Error updating inventory with backorder processing:', error)
      return {
        success: false,
        previousStock: 0,
        newStock: 0,
        backordersFulfilled: 0,
        notificationsSent: 0,
        message: 'Failed to update inventory: ' + (error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  /**
   * Allocate inventory for backorder fulfillment
   */
  async allocateForBackorder(
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<{
    success: boolean
    allocated: number
    remaining: number
    message: string
  }> {
    try {
      // Check available stock
      const stockInfo = await this.checkStock([{ productId, variantId, quantity }])
      const available = stockInfo[0]?.currentStock || 0

      if (available <= 0) {
        return {
          success: false,
          allocated: 0,
          remaining: quantity,
          message: 'No stock available for allocation'
        }
      }

      const allocatedQuantity = Math.min(quantity, available)
      const remainingQuantity = quantity - allocatedQuantity

      // Reserve the allocated quantity
      const reserveResult = await this.reserveInventory([{
        productId,
        variantId,
        quantity: allocatedQuantity
      }])

      if (!reserveResult.success) {
        return {
          success: false,
          allocated: 0,
          remaining: quantity,
          message: reserveResult.errors.join(', ')
        }
      }

      return {
        success: true,
        allocated: allocatedQuantity,
        remaining: remainingQuantity,
        message: `Allocated ${allocatedQuantity} units, ${remainingQuantity} remaining`
      }

    } catch (error) {
      console.error('Error allocating inventory for backorder:', error)
      return {
        success: false,
        allocated: 0,
        remaining: quantity,
        message: 'Failed to allocate inventory: ' + (error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  /**
   * Handle partial fulfillment for backorders
   */
  async handlePartialFulfillment(
    orderId: string,
    items: Array<{
      productId: string
      variantId?: string
      requestedQuantity: number
      availableQuantity: number
    }>
  ): Promise<{
    success: boolean
    fulfilledItems: InventoryItem[]
    remainingItems: InventoryItem[]
    message: string
  }> {
    try {
      const fulfilledItems: InventoryItem[] = []
      const remainingItems: InventoryItem[] = []

      // Process each item
      for (const item of items) {
        if (item.availableQuantity > 0) {
          // Allocate what's available
          const allocateResult = await this.allocateForBackorder(
            item.productId,
            item.variantId,
            item.availableQuantity
          )

          if (allocateResult.success && allocateResult.allocated > 0) {
            fulfilledItems.push({
              productId: item.productId,
              variantId: item.variantId,
              quantity: allocateResult.allocated
            })
          }

          // Track remaining quantity
          const remaining = item.requestedQuantity - allocateResult.allocated
          if (remaining > 0) {
            remainingItems.push({
              productId: item.productId,
              variantId: item.variantId,
              quantity: remaining
            })
          }
        } else {
          // No stock available, entire quantity remains
          remainingItems.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.requestedQuantity
          })
        }
      }

      // Update the order with partial fulfillment
      if (fulfilledItems.length > 0) {
        // Create a new order for the fulfilled items
        // and update the original order with remaining items
        // This would require more complex order management logic
      }

      return {
        success: true,
        fulfilledItems,
        remainingItems,
        message: `Partially fulfilled: ${fulfilledItems.length} items fulfilled, ${remainingItems.length} items remaining`
      }

    } catch (error) {
      console.error('Error handling partial fulfillment:', error)
      return {
        success: false,
        fulfilledItems: [],
        remainingItems: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.requestedQuantity
        })),
        message: 'Failed to handle partial fulfillment: ' + (error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  /**
   * Restore inventory for cancelled backorders
   */
  async restoreBackorderInventory(
    orderId: string,
    items: InventoryItem[]
  ): Promise<InventoryResult> {
    try {
      // Restore the inventory
      const result = await this.restoreInventory(items)

      if (result.success) {
        // Log the restoration for audit purposes
        console.log(`Restored inventory for cancelled backorder ${orderId}:`, items)
      }

      return result

    } catch (error) {
      console.error('Error restoring backorder inventory:', error)
      return {
        success: false,
        errors: ['Failed to restore backorder inventory: ' + (error instanceof Error ? error.message : 'Unknown error')],
        updatedItems: []
      }
    }
  }

  /**
   * Get backorder allocation summary
   */
  async getBackorderAllocationSummary(): Promise<{
    totalPendingBackorders: number
    totalAllocatedQuantity: number
    pendingAllocation: Array<{
      productId: string
      productName: string
      variantId?: string
      variantSku?: string
      pendingQuantity: number
      availableStock: number
    }>
  }> {
    try {
      // Get all pending backorders
      const pendingBackorders = await prisma.order.findMany({
        where: {
          orderType: 'backorder',
          status: 'PENDING'
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, stock: true }
              }
            }
          }
        }
      })

      let totalPendingBackorders = pendingBackorders.length
      let totalAllocatedQuantity = 0

      // Group by product/variant to calculate pending quantities
      const pendingAllocation = new Map<string, {
        productId: string
        productName: string
        variantId?: string
        variantSku?: string
        pendingQuantity: number
        availableStock: number
      }>()

      for (const order of pendingBackorders) {
        for (const item of order.items) {
          const key = `${item.productId}-${item.variantId || 'none'}`
          
          if (!pendingAllocation.has(key)) {
            pendingAllocation.set(key, {
              productId: item.productId,
              productName: item.product.name,
              variantId: item.variantId || undefined,
              variantSku: item.variantId ? `Variant-${item.variantId}` : undefined,
              pendingQuantity: 0,
              availableStock: item.product.stock
            })
          }

          const allocation = pendingAllocation.get(key)!
          allocation.pendingQuantity += item.quantity
          totalAllocatedQuantity += item.quantity
        }
      }

      return {
        totalPendingBackorders,
        totalAllocatedQuantity,
        pendingAllocation: Array.from(pendingAllocation.values())
      }

    } catch (error) {
      console.error('Error getting backorder allocation summary:', error)
      return {
        totalPendingBackorders: 0,
        totalAllocatedQuantity: 0,
        pendingAllocation: []
      }
    }
  }
}

export const inventoryService = new InventoryService()