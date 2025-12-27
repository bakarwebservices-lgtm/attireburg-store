import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sampleProducts, sampleReviews } from '@/lib/sampleData'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

        product = {
          ...product,
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

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('Updating product with data:', body)

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
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
      
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      })

      // Create new variants
      if (body.variants.length > 0) {
        const variantData = body.variants.map((variant: any) => ({
          productId: id,
          sku: variant.sku,
          price: variant.price ? parseFloat(variant.price) : null,
          salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
          stock: parseInt(variant.stock) || 0,
          images: variant.images || [],
          attributes: variant.attributes || {},
          isActive: variant.isActive !== undefined ? variant.isActive : true
        }))
        
        console.log('Creating variants with data:', variantData)
        
        await prisma.productVariant.createMany({
          data: variantData
        })
      }
    } else if (body.hasVariants === false) {
      // If variants are disabled, remove all existing variants
      console.log('Removing all variants as hasVariants is false')
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      })
    }

    console.log('Product updated:', updatedProduct)

    return NextResponse.json({
      success: true,
      product: updatedProduct,
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

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produkt nicht gefunden' },
        { status: 404 }
      )
    }

    // Delete product
    await prisma.product.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Produkt erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Produkts',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}