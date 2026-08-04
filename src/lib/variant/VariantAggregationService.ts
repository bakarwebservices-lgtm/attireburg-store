// Variant aggregation service for calculating totals and metrics
import { prisma } from '@/lib/prisma'

export interface ProductVariantSummary {
  productId: string
  productName: string
  totalVariants: number
  activeVariants: number
  inactiveVariants: number
  totalInventory: number
  averagePrice: number
  minPrice: number
  maxPrice: number
  outOfStockVariants: number
  lowStockVariants: number
  variantDetails: Array<{
    id: string
    sku: string
    attributes: any
    price: number
    stock: number
    isActive: boolean
  }>
}

export interface VariantPerformanceMetrics {
  totalProducts: number
  totalVariants: number
  averageVariantsPerProduct: number
  totalInventoryValue: number
  outOfStockCount: number
  lowStockCount: number
  topPerformingVariants: Array<{
    id: string
    sku: string
    productName: string
    attributes: any
    price: number
    stock: number
    salesCount?: number
  }>
}

export interface VariantInventoryReport {
  productId: string
  productName: string
  variants: Array<{
    id: string
    sku: string
    attributes: any
    stock: number
    reservedStock: number
    availableStock: number
    reorderLevel: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  }>
  totalStock: number
  totalReserved: number
  totalAvailable: number
}

class VariantAggregationService {
  /**
   * Get comprehensive variant summary for a specific product
   */
  async getProductVariantSummary(productId: string): Promise<ProductVariantSummary | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          variants: {
            select: {
              id: true,
              sku: true,
              attributes: true,
              price: true,
              stock: true,
              isActive: true,
              blankGarmentId: true,
              blankGarment: {
                select: { stock: true }
              }
            }
          }
        }
      })

      if (!product) {
        return null
      }

      const defaultPrice = product.price
      const variants = product.variants.map(v => ({
        ...v,
        stock: v.blankGarmentId && v.blankGarment ? v.blankGarment.stock : v.stock,
        price: v.price !== null && v.price !== undefined ? v.price : defaultPrice
      }))
      
      const activeVariants = variants.filter(v => v.isActive)
      const inactiveVariants = variants.filter(v => !v.isActive)
      const outOfStockVariants = variants.filter(v => v.stock === 0)
      const lowStockVariants = variants.filter(v => v.stock > 0 && v.stock <= 5)

      // Calculate unique pool stocks + unlinked variant stocks to avoid double-counting
      const poolIdsSeen = new Set<string>()
      let totalInventory = 0
      for (const v of variants) {
        if (v.blankGarmentId) {
          if (!poolIdsSeen.has(v.blankGarmentId)) {
            poolIdsSeen.add(v.blankGarmentId)
            totalInventory += v.stock
          }
        } else {
          totalInventory += v.stock
        }
      }

      const prices = variants.map(v => v.price)
      const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      return {
        productId: product.id,
        productName: product.name,
        totalVariants: variants.length,
        activeVariants: activeVariants.length,
        inactiveVariants: inactiveVariants.length,
        totalInventory,
        averagePrice,
        minPrice,
        maxPrice,
        outOfStockVariants: outOfStockVariants.length,
        lowStockVariants: lowStockVariants.length,
        variantDetails: variants.map(v => ({
          id: v.id,
          sku: v.sku,
          attributes: v.attributes,
          price: v.price,
          stock: v.stock,
          isActive: v.isActive
        }))
      }
    } catch (error) {
      console.error('Error getting product variant summary:', error)
      return null
    }
  }

  /**
   * Get variant performance metrics across all products
   */
  async getVariantPerformanceMetrics(): Promise<VariantPerformanceMetrics> {
    try {
      const [products, variants, pools] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: { id: true }
        }),
        prisma.productVariant.findMany({
          where: { isActive: true },
          include: {
            product: {
              select: { name: true, price: true }
            },
            blankGarment: {
              select: { stock: true }
            }
          }
        }),
        prisma.blankGarment.findMany({
          where: { isActive: true },
          select: { id: true, stock: true }
        })
      ])

      const totalProducts = products.length
      const totalVariants = variants.length
      const averageVariantsPerProduct = totalProducts > 0 ? totalVariants / totalProducts : 0

      const mappedVariants = variants.map(v => ({
        ...v,
        stock: v.blankGarmentId && v.blankGarment ? v.blankGarment.stock : v.stock,
        price: v.price !== null && v.price !== undefined ? v.price : v.product.price
      }))

      // Inventory value = unique pool stock value + unlinked variants inventory value
      let totalInventoryValue = 0
      const poolsCounted = new Set<string>()
      for (const v of mappedVariants) {
        if (v.blankGarmentId) {
          if (!poolsCounted.has(v.blankGarmentId)) {
            poolsCounted.add(v.blankGarmentId)
            totalInventoryValue += (v.price * v.stock)
          }
        } else {
          totalInventoryValue += (v.price * v.stock)
        }
      }

      const outOfStockCount = mappedVariants.filter(v => v.stock === 0).length
      const lowStockCount = mappedVariants.filter(v => v.stock > 0 && v.stock <= 5).length

      const topPerformingVariants = mappedVariants
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 10)
        .map(v => ({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
          attributes: v.attributes,
          price: v.price,
          stock: v.stock
        }))

      return {
        totalProducts,
        totalVariants,
        averageVariantsPerProduct,
        totalInventoryValue,
        outOfStockCount,
        lowStockCount,
        topPerformingVariants
      }
    } catch (error) {
      console.error('Error getting variant performance metrics:', error)
      return {
        totalProducts: 0,
        totalVariants: 0,
        averageVariantsPerProduct: 0,
        totalInventoryValue: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        topPerformingVariants: []
      }
    }
  }

  /**
   * Get detailed inventory report for all products with variants
   */
  async getVariantInventoryReport(): Promise<VariantInventoryReport[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          hasVariants: true
        },
        include: {
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              attributes: true,
              stock: true,
              blankGarmentId: true,
              blankGarment: {
                select: { stock: true }
              }
            }
          }
        }
      })

      // Fetch all active pool reservations grouped by pool
      const activeReservations = await prisma.poolReservation.groupBy({
        by: ['blankGarmentId'],
        where: { expiresAt: { gt: new Date() } },
        _sum: { quantity: true }
      })
      const reservationMap = Object.fromEntries(activeReservations.map(r => [r.blankGarmentId, r._sum.quantity || 0]))

      return products.map(product => {
        const variants = product.variants.map(variant => {
          const rawStock = variant.blankGarmentId && variant.blankGarment ? variant.blankGarment.stock : variant.stock
          const reservedStock = variant.blankGarmentId ? (reservationMap[variant.blankGarmentId] || 0) : 0
          const availableStock = Math.max(0, rawStock - reservedStock)
          const reorderLevel = 5
          
          let status: 'in_stock' | 'low_stock' | 'out_of_stock'
          if (availableStock === 0) {
            status = 'out_of_stock'
          } else if (availableStock <= reorderLevel) {
            status = 'low_stock'
          } else {
            status = 'in_stock'
          }

          return {
            id: variant.id,
            sku: variant.sku,
            attributes: variant.attributes,
            stock: rawStock,
            reservedStock,
            availableStock,
            reorderLevel,
            status
          }
        })

        const poolsSeen = new Set<string>()
        let totalStock = 0
        let totalReserved = 0
        let totalAvailable = 0
        for (const variant of product.variants) {
          const rawStock = variant.blankGarmentId && variant.blankGarment ? variant.blankGarment.stock : variant.stock
          const resStock = variant.blankGarmentId ? (reservationMap[variant.blankGarmentId] || 0) : 0
          if (variant.blankGarmentId) {
            if (!poolsSeen.has(variant.blankGarmentId)) {
              poolsSeen.add(variant.blankGarmentId)
              totalStock += rawStock
              totalReserved += resStock
              totalAvailable += Math.max(0, rawStock - resStock)
            }
          } else {
            totalStock += rawStock
            totalAvailable += rawStock
          }
        }

        return {
          productId: product.id,
          productName: product.name,
          variants,
          totalStock,
          totalReserved,
          totalAvailable
        }
      })
    } catch (error) {
      console.error('Error getting variant inventory report:', error)
      return []
    }
  }

  /**
   * Get variant count tracking per product
   */
  async getVariantCountsByProduct(): Promise<Array<{
    productId: string
    productName: string
    totalVariants: number
    activeVariants: number
    inactiveVariants: number
  }>> {
    try {
      const products = await prisma.product.findMany({
        include: {
          variants: {
            select: {
              id: true,
              isActive: true
            }
          }
        }
      })

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        totalVariants: product.variants.length,
        activeVariants: product.variants.filter(v => v.isActive).length,
        inactiveVariants: product.variants.filter(v => !v.isActive).length
      }))
    } catch (error) {
      console.error('Error getting variant counts by product:', error)
      return []
    }
  }

  /**
   * Calculate total inventory across all variants for a product (deduped per pool)
   */
  async calculateTotalInventory(productId: string): Promise<number> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: {
          productId,
          isActive: true
        },
        select: {
          stock: true,
          blankGarmentId: true,
          blankGarment: {
            select: { stock: true }
          }
        }
      })

      const poolsSeen = new Set<string>()
      let total = 0
      for (const v of variants) {
        if (v.blankGarmentId) {
          if (!poolsSeen.has(v.blankGarmentId)) {
            poolsSeen.add(v.blankGarmentId)
            total += (v.blankGarment?.stock || 0)
          }
        } else {
          total += v.stock
        }
      }

      return total
    } catch (error) {
      console.error('Error calculating total inventory:', error)
      return 0
    }
  }

  /**
   * Get low stock alerts for variants (checking pool stock if linked)
   */
  async getLowStockVariants(threshold: number = 5): Promise<Array<{
    id: string
    sku: string
    productId: string
    productName: string
    attributes: any
    stock: number
    threshold: number
  }>> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: {
          isActive: true
        },
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          },
          blankGarment: {
            select: { stock: true }
          }
        }
      })

      const lowStockVariants = []
      for (const variant of variants) {
        const stock = variant.blankGarmentId && variant.blankGarment ? variant.blankGarment.stock : variant.stock
        if (stock > 0 && stock <= threshold) {
          lowStockVariants.push({
            id: variant.id,
            sku: variant.sku,
            productId: variant.product.id,
            productName: variant.product.name,
            attributes: variant.attributes,
            stock,
            threshold
          })
        }
      }

      return lowStockVariants
    } catch (error) {
      console.error('Error getting low stock variants:', error)
      return []
    }
  }

  /**
   * Get out of stock variants
   */
  async getOutOfStockVariants(): Promise<Array<{
    id: string
    sku: string
    productId: string
    productName: string
    attributes: any
  }>> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: {
          isActive: true,
          stock: 0
        },
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        productId: variant.product.id,
        productName: variant.product.name,
        attributes: variant.attributes
      }))
    } catch (error) {
      console.error('Error getting out of stock variants:', error)
      return []
    }
  }
}

export const variantAggregationService = new VariantAggregationService()