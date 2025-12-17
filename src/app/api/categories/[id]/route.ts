import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/lib/services/categoryService'
import { connectDB } from '@/lib/db'

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const bySlug = searchParams.get('bySlug') === 'true'
    
    let category
    if (bySlug) {
      category = await categoryService.getCategoryBySlug(params.id)
    } else {
      category = await categoryService.getCategoryById(params.id)
    }
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    const category = await categoryService.updateCategory(params.id, body)
    
    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const moveProductsTo = searchParams.get('moveProductsTo') || undefined
    
    const success = await categoryService.deleteCategory(params.id, moveProductsTo)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Category not found or could not be deleted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}