import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sampleProducts, sampleReviews } from '@/lib/sampleData'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let product: any = null

    try {
      // Try database first
      product = await prisma.product.findUnique({
        where: {
          id: params.id,
          isActive: true,
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
          }
        }
      })

      if (product) {
        // Calculate average rating
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
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
      const sampleProduct = sampleProducts.find(p => p.id === params.id)
      if (sampleProduct) {
        const productReviews = sampleReviews.filter(r => r.productId === params.id)
        
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