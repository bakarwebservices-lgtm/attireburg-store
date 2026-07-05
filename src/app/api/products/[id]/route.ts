import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sampleProducts, sampleReviews } from '@/lib/sampleData'
import { verifyToken } from '@/lib/auth'
import { InventoryMonitor } from '@/lib/backorder'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let product: any = null

    try {
      // Try database first
      product = await prisma.product.findUnique({
        where: {
          id: id,
        },
        include: {
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  firstName: true,
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          variants: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              sku: true,
              price: true,
              salePrice: true,
              stock: true,
              images: true,
              attributes: true,
              isActive: true,
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      if (product) {
        // Calculate average rating
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
          : 0

        // Compute live stock if product has variants
        const liveStock = product.hasVariants && product.variants && product.variants.length > 0
          ? product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
          : product.stock

        product = {
          ...product,
          stock: liveStock,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: product.reviews.length,
        }
      }
    } catch (dbError) {
      console.log('Database not available, using sample data')
      
      // Use sample data
      const sampleProduct = sampleProducts.find(p => p.id === id)
      if (sampleProduct) {
        const productReviews = sampleReviews.filter(r => r.productId === id)
        
        product = {
          ...sampleProduct,
          reviews: productReviews,
          avgRating: sampleProduct.avgRating,
          reviewCount: sampleProduct.reviewCount
        }
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Produkt nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Produkts' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin auth
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminUser = verifyToken(token)
  if (!adminUser || !adminUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id },
      include: { variants: true }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produkt nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if SKU is being changed and if it already exists
    if (body.sku && body.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: body.sku }
      })

      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU bereits vorhanden' },
          { status: 400 }
        )
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        name: body.name || existingProduct.name,
        nameEn: body.nameEn || body.name || existingProduct.nameEn,
        description: body.description || existingProduct.description,
        descriptionEn: body.descriptionEn || body.description || existingProduct.descriptionEn,
        price: body.price ? parseFloat(body.price) : existingProduct.price,
        salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
        sku: body.sku || existingProduct.sku,
        stock: body.stock !== undefined ? parseInt(body.stock) : existingProduct.stock,
        category: body.category || existingProduct.category,
        sizes: body.sizes || existingProduct.sizes,
        colors: body.colors || existingProduct.colors,
        tags: body.tags || existingProduct.tags,
        images: body.images || existingProduct.images,
        featured: body.featured !== undefined ? body.featured : existingProduct.featured,
        onSale: body.salePrice ? !!body.salePrice : existingProduct.onSale,
        weight: body.weight ? parseFloat(body.weight) : existingProduct.weight,
        metaTitle: body.metaTitle !== undefined ? body.metaTitle : existingProduct.metaTitle,
        metaDescription: body.metaDescription !== undefined ? body.metaDescription : existingProduct.metaDescription,
        isActive: body.isActive !== undefined ? body.isActive : existingProduct.isActive,
        hasVariants: body.hasVariants !== undefined ? body.hasVariants : existingProduct.hasVariants,
        attributes: body.attributes !== undefined ? body.attributes : existingProduct.attributes,
        updatedAt: new Date()
      }
    })

    // Handle variants if they exist
    if (body.hasVariants && body.variants && Array.isArray(body.variants)) {
      console.log('Processing variants:', body.variants)
      
      // Find existing variants
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: id }
      })

      const skusInBody = body.variants.map((v: any) => v.sku)

      // Delete variants that are no longer in the body
      await prisma.productVariant.deleteMany({
        where: {
          productId: id,
          sku: { notIn: skusInBody }
        }
      })

      // Update or create variants
      for (const variant of body.variants) {
        const existing = existingVariants.find(ev => ev.sku === variant.sku)
        const variantStock = parseInt(variant.stock) || 0
        
        const variantData = {
          price: variant.price ? parseFloat(variant.price) : null,
          salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
          stock: variantStock,
          images: variant.images || [],
          attributes: variant.attributes || {},
          isActive: variant.isActive !== undefined ? variant.isActive : true
        }

        if (existing) {
          // Update existing variant
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: variantData
          })

          // Trigger restock check if stock went from 0 to > 0
          if (variantStock > 0 && existing.stock === 0) {
            const inventoryMonitor = new InventoryMonitor(prisma)
            inventoryMonitor.triggerRestockProcessing(id, existing.id, variantStock)
              .catch(err => console.error('Background variant restock notification error:', err))
          }
        } else {
          // Create new variant
          const createdVar = await prisma.productVariant.create({
            data: {
              productId: id,
              sku: variant.sku,
              ...variantData
            }
          })

          // Trigger restock check if created with stock > 0
          if (variantStock > 0) {
            const inventoryMonitor = new InventoryMonitor(prisma)
            inventoryMonitor.triggerRestockProcessing(id, createdVar.id, variantStock)
              .catch(err => console.error('Background new variant restock notification error:', err))
          }
        }
      }
    } else if (body.hasVariants === false) {
      // If variants are disabled, remove all existing variants
      console.log('Removing all variants as hasVariants is false')
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      })
    }

    // Sync product stock with variant stock if hasVariants is true
    let finalUpdatedProduct = updatedProduct
    if (body.hasVariants && body.variants && Array.isArray(body.variants)) {
      const allVariants = await prisma.productVariant.findMany({
        where: { productId: id, isActive: true }
      })
      const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0)
      
      // Update parent product stock in DB
      finalUpdatedProduct = await prisma.product.update({
        where: { id: id },
        data: { stock: totalStock }
      })
    }

    console.log('Product updated:', finalUpdatedProduct)

    // Trigger restock processing in the background if product stock went from 0 to > 0 (only if no variants)
    try {
      const isProductRestocked = !body.hasVariants && finalUpdatedProduct.stock > 0 && existingProduct.stock === 0
      
      if (isProductRestocked) {
        const inventoryMonitor = new InventoryMonitor(prisma)
        inventoryMonitor.triggerRestockProcessing(finalUpdatedProduct.id, undefined, finalUpdatedProduct.stock)
          .catch(err => console.error('Background restock notification error:', err))
      }
    } catch (restockErr) {
      console.error('Failed to trigger restock check:', restockErr)
    }

    return NextResponse.json({
      success: true,
      product: finalUpdatedProduct,
      message: 'Produkt erfolgreich aktualisiert'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren des Produkts',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin auth
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminUser = verifyToken(token)
  if (!adminUser || !adminUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: { select: { status: true } }
          }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }

    // Check if there are active (non-completed) orders referencing this product
    const activeOrders = existingProduct.orderItems.filter(item =>
      !['DELIVERED', 'CANCELLED'].includes(item.order.status)
    )

    if (activeOrders.length > 0) {
      // Soft-delete: deactivate so it no longer shows on site
      await prisma.product.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Produkt hat ${activeOrders.length} aktive Bestellung(en) und wurde deaktiviert statt gelöscht.`
      })
    }

    // No active orders — safe to hard delete
    // Delete order items referencing this product (historical records)
    await prisma.orderItem.deleteMany({ where: { productId: id } })
    await prisma.productVariant.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Produkt erfolgreich gelöscht' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Produkts', message: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}