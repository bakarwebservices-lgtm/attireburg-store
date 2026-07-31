import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/products/bulk - Bulk operations on products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productIds, data } = body
    
    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: action, productIds' 
        },
        { status: 400 }
      )
    }
    
    let result
    let message
    
    switch (action) {
      case 'updateStatus':
      case 'update-status':
        if (data?.status === undefined) {
          return NextResponse.json(
            { success: false, error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }
        const statusResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: data.status === 'published' || data.status === true }
        })
        result = statusResult.count
        message = `Updated status for ${result} products`
        break
        
      case 'updateCategory':
      case 'update-category':
        if (!data?.category && !data?.categoryId) {
          return NextResponse.json(
            { success: false, error: 'Category is required for updateCategory action' },
            { status: 400 }
          )
        }
        const categoryResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { category: data.category || data.categoryId }
        })
        result = categoryResult.count
        message = `Updated category for ${result} products`
        break
        
      case 'updateFeatured':
      case 'toggle-featured':
        if (data?.featured === undefined) {
          // Toggle featured for selected products individually
          const prods = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, featured: true }
          })
          for (const p of prods) {
            await prisma.product.update({
              where: { id: p.id },
              data: { featured: !p.featured }
            })
          }
          result = prods.length
        } else {
          const featuredResult = await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { featured: Boolean(data.featured) }
          })
          result = featuredResult.count
        }
        message = `Updated featured status for ${result} products`
        break

      case 'updateStock':
      case 'update-stock': {
        if (data?.type === undefined || data?.value === undefined) {
          return NextResponse.json(
            { success: false, error: 'Type and value are required for updateStock action' },
            { status: 400 }
          )
        }

        const productsToUpdate = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { variants: true }
        })

        let count = 0
        for (const prod of productsToUpdate) {
          let newStock = prod.stock
          const val = parseInt(data.value) || 0
          if (data.type === 'set') {
            newStock = Math.max(0, val)
          } else if (data.type === 'add') {
            newStock = Math.max(0, prod.stock + val)
          } else if (data.type === 'subtract') {
            newStock = Math.max(0, prod.stock - val)
          }

          if (prod.hasVariants && prod.variants.length > 0) {
            const perVariantStock = Math.max(0, Math.floor(newStock / prod.variants.length))
            for (const v of prod.variants) {
              await prisma.productVariant.update({
                where: { id: v.id },
                data: { stock: perVariantStock }
              })
            }
            const totalVariantStock = perVariantStock * prod.variants.length
            await prisma.product.update({
              where: { id: prod.id },
              data: { stock: totalVariantStock }
            })
          } else {
            await prisma.product.update({
              where: { id: prod.id },
              data: { stock: newStock }
            })
          }
          count++
        }

        result = count
        message = `Updated stock for ${result} products`
        break
      }

      case 'updatePrice':
      case 'update-price': {
        if (data?.type === undefined || data?.value === undefined) {
          return NextResponse.json(
            { success: false, error: 'Type and value are required for updatePrice action' },
            { status: 400 }
          )
        }

        const productsToUpdate = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { variants: true }
        })

        let count = 0
        for (const prod of productsToUpdate) {
          let newPrice = prod.price
          const val = parseFloat(data.value) || 0
          if (data.type === 'percentage') {
            newPrice = prod.price * (1 + val / 100)
          } else {
            newPrice = prod.price + val
          }
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100)

          await prisma.product.update({
            where: { id: prod.id },
            data: { price: newPrice }
          })

          if (prod.hasVariants && prod.variants.length > 0) {
            for (const v of prod.variants) {
              const currentVPrice = v.price ?? prod.price
              let newVPrice = currentVPrice
              if (data.type === 'percentage') {
                newVPrice = currentVPrice * (1 + val / 100)
              } else {
                newVPrice = currentVPrice + val
              }
              newVPrice = Math.max(0, Math.round(newVPrice * 100) / 100)

              await prisma.productVariant.update({
                where: { id: v.id },
                data: { price: newVPrice }
              })
            }
          }
          count++
        }

        result = count
        message = `Updated prices for ${result} products`
        break
      }
        
      case 'delete':
        // First delete related variants
        await prisma.productVariant.deleteMany({
          where: { productId: { in: productIds } }
        })
        
        const deleteResult = await prisma.product.deleteMany({
          where: { id: { in: productIds } }
        })
        result = deleteResult.count
        message = `Deleted ${result} products`
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message,
      affected: result
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}