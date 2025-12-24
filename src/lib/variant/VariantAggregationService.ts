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
        include: {
          variants: {
            select: {
              id: true,
              sku: true,
              attributes: true,
              price: true,
              stock: true,
              isActive: true
            }
          }
        }
      })

      if (!product) {
        return null
      }

      const variants = product.variants
      const activeVariants = variants.filter(v => v.isActive)
      const inactiveVariants = variants.filter(v => !v.isActive)
      const outOfStockVariants = variants.filter(v => v.stock === 0)
      const lowStockVariants = variants.filter(v => v.stock > 0 && v.stock <= 5)

      const totalInventory = variants.reduce((sum, v) => sum + v.stock, 0)
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
        variantDetails: variants
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
      const [products, variants] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: { id: true }
        }),
        prisma.productVariant.findMany({
          where: { isActive: true },
          include: {
            product: {
              select: { name: true }
            }
          }
        })
      ])

      const totalProducts = products.length
      const totalVariants = variants.length
      const averageVariantsPerProduct = totalProducts > 0 ? totalVariants / totalProducts : 0

      const totalInventoryValue = variants.reduce((sum, v) => sum + (v.price * v.stock), 0)
      const outOfStockCount = variants.filter(v => v.stock === 0).length
      const lowStockCount = variants.filter(v => v.stock > 0 && v.stock <= 5).length

      // Get top performing variants (by stock level as a proxy for sales)
      const topPerformingVariants = variants
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
          isActive: true,
          hasVariants: true
        },
        include: {
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              attributes: true,
              stock: true
            }
          }
        }
      })

      return products.map(product => {
        const variants = product.variants.map(variant => {
          const reservedStock = 0 // TODO: Calculate from pending orders
          const availableStock = Math.max(0, variant.stock - reservedStock)
          const reorderLevel = 5 // Default reorder level
          
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
            stock: variant.stock,
            reservedStock,
            availableStock,
            reorderLevel,
            status
          }
        })

        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)
        const totalReserved = variants.reduce((sum, v) => sum + v.reservedStock, 0)
        const totalAvailable = variants.reduce((sum, v) => sum + v.availableStock, 0)

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
        where: { isActive: true },
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
   * Calculate total inventory across all variants for a product
   */
  async calculateTotalInventory(productId: string): Promise<number> {
    try {
      const result = await prisma.productVariant.aggregate({
        where: {
          productId,
          isActive: true
        },
        _sum: {
          stock: true
        }
      })

      return result._sum.stock || 0
    } catch (error) {
      console.error('Error calculating total inventory:', error)
      return 0
    }
  }

  /**
   * Get low stock alerts for variants
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
          isActive: true,
          stock: {
            lte: threshold,
            gt: 0
          }
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
        attributes: variant.attributes,
        stock: variant.stock,
        threshold
      }))
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