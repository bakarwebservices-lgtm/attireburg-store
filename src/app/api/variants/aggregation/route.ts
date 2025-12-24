import { NextRequest, NextResponse } from 'next/server'
import { variantAggregationService } from '@/lib/variant/VariantAggregationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const threshold = searchParams.get('threshold')

    switch (type) {
      case 'product-summary':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for product summary' },
            { status: 400 }
          )
        }
        const summary = await variantAggregationService.getProductVariantSummary(productId)
        return NextResponse.json({ summary })

      case 'performance-metrics':
        const metrics = await variantAggregationService.getVariantPerformanceMetrics()
        return NextResponse.json({ metrics })

      case 'inventory-report':
        const report = await variantAggregationService.getVariantInventoryReport()
        return NextResponse.json({ report })

      case 'variant-counts':
        const counts = await variantAggregationService.getVariantCountsByProduct()
        return NextResponse.json({ counts })

      case 'low-stock':
        const lowStockThreshold = threshold ? parseInt(threshold) : 5
        const lowStock = await variantAggregationService.getLowStockVariants(lowStockThreshold)
        return NextResponse.json({ lowStock })

      case 'out-of-stock':
        const outOfStock = await variantAggregationService.getOutOfStockVariants()
        return NextResponse.json({ outOfStock })

      case 'total-inventory':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for total inventory' },
            { status: 400 }
          )
        }
        const totalInventory = await variantAggregationService.calculateTotalInventory(productId)
        return NextResponse.json({ totalInventory })

      default:
        return NextResponse.json(
          { error: 'Invalid aggregation type. Supported types: product-summary, performance-metrics, inventory-report, variant-counts, low-stock, out-of-stock, total-inventory' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in variant aggregation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}