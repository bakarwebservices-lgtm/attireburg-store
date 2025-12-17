import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sampleProducts } from '@/lib/sampleData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const featured = searchParams.get('featured')
    const onSale = searchParams.get('onSale')

    const skip = (page - 1) * limit

    // Try to use database first, fallback to sample data
    let products: any[] = []
    let total = 0

    try {
      // Build where clause
      const where: any = {
        isActive: true,
      }

      if (category) {
        where.category = category
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { descriptionEn: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (featured === 'true') {
        where.featured = true
      }

      if (onSale === 'true') {
        where.onSale = true
      }

      // Build orderBy clause
      const orderBy: any = {}
      if (sortBy === 'price') {
        orderBy.price = sortOrder
      } else if (sortBy === 'name') {
        orderBy.name = sortOrder
      } else {
        orderBy[sortBy] = sortOrder
      }

      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            reviews: {
              select: {
                rating: true,
              }
            }
          }
        }),
        prisma.product.count({ where })
      ])

      // Calculate average ratings
      products = dbProducts.map(product => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0
        
        return {
          ...product,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: product.reviews.length,
          reviews: undefined // Remove reviews from response
        }
      })

      total = dbTotal
    } catch (dbError) {
      console.log('Database not available, using sample data')
      
      // Filter sample products
      let filteredProducts = sampleProducts.filter(product => {
        if (category && product.category !== category) return false
        if (featured === 'true' && !product.featured) return false
        if (onSale === 'true' && !product.onSale) return false
        if (search) {
          const searchLower = search.toLowerCase()
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.nameEn.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.descriptionEn.toLowerCase().includes(searchLower)
          )
        }
        return true
      })

      // Sort products
      filteredProducts.sort((a, b) => {
        let aValue: any, bValue: any
        
        if (sortBy === 'price') {
          aValue = a.price
          bValue = b.price
        } else if (sortBy === 'name') {
          aValue = a.name
          bValue = b.name
        } else {
          // Default to name for sample data
          aValue = a.name
          bValue = b.name
        }

        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : 1
        } else {
          return aValue < bValue ? -1 : 1
        }
      })

      total = filteredProducts.length
      products = filteredProducts.slice(skip, skip + limit)
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Produkte' },
      { status: 500 }
    )
  }
}