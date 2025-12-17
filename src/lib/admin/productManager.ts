// Product Management System for Admin Portal

export interface ProductAttribute {
  name: string
  values: string[]
  variation: boolean
  visible: boolean
}

export interface ProductVariation {
  id: string
  attributes: { [key: string]: string }
  sku: string
  price: number
  salePrice?: number
  stock: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  image?: string
}

export interface SEOData {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  slug: string
}

export interface Product {
  id: string
  
  // Basic Information
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  shortDescription: string
  shortDescriptionEn: string
  
  // Pricing
  price: number
  salePrice?: number
  costPrice?: number
  
  // Inventory
  sku: string
  manageStock: boolean
  stock: number
  lowStockThreshold: number
  backordersAllowed: boolean
  
  // Shipping
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass: string
  
  // Organization
  category: string
  tags: string[]
  
  // Media
  images: string[]
  gallery: string[]
  
  // Attributes & Variations
  attributes: ProductAttribute[]
  variations: ProductVariation[]
  
  // SEO
  seo: SEOData
  
  // Status & Visibility
  status: 'draft' | 'published' | 'private'
  featured: boolean
  catalogVisibility: 'visible' | 'catalog' | 'search' | 'hidden'
  
  // Advanced
  purchaseNote: string
  menuOrder: number
  enableReviews: boolean
  
  // Dates
  dateOnSaleFrom?: string
  dateOnSaleTo?: string
  createdAt: string
  updatedAt: string
  
  // Analytics
  views: number
  sales: number
  revenue: number
  avgRating: number
  reviewCount: number
}

export interface ProductCategory {
  id: string
  name: string
  nameEn: string
  slug: string
  description?: string
  descriptionEn?: string
  image?: string
  parentId?: string
  menuOrder: number
  count: number
}

export interface ProductTag {
  id: string
  name: string
  slug: string
  count: number
}

export class ProductManager {
  private static instance: ProductManager
  private products: Map<string, Product> = new Map()
  private categories: Map<string, ProductCategory> = new Map()
  private tags: Map<string, ProductTag> = new Map()

  static getInstance(): ProductManager {
    if (!ProductManager.instance) {
      ProductManager.instance = new ProductManager()
    }
    return ProductManager.instance
  }

  // Product CRUD Operations
  createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'sales' | 'revenue'>): Product {
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const product: Product = {
      ...productData,
      id: productId,
      createdAt: now,
      updatedAt: now,
      views: 0,
      sales: 0,
      revenue: 0
    }

    // Generate slug if not provided
    if (!product.seo.slug) {
      product.seo.slug = this.generateSlug(product.name)
    }

    // Generate SKU if not provided
    if (!product.sku) {
      product.sku = this.generateSKU(product.name, product.category)
    }

    this.products.set(productId, product)
    this.updateCategoryCount(product.category, 1)
    this.updateTagCounts(product.tags, 1)
    
    return product
  }

  getProduct(productId: string): Product | undefined {
    return this.products.get(productId)
  }

  updateProduct(productId: string, updates: Partial<Product>): Product | null {
    const product = this.products.get(productId)
    if (!product) return null

    // Handle category change
    if (updates.category && updates.category !== product.category) {
      this.updateCategoryCount(product.category, -1)
      this.updateCategoryCount(updates.category, 1)
    }

    // Handle tag changes
    if (updates.tags) {
      this.updateTagCounts(product.tags, -1)
      this.updateTagCounts(updates.tags, 1)
    }

    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.products.set(productId, updatedProduct)
    return updatedProduct
  }

  deleteProduct(productId: string): boolean {
    const product = this.products.get(productId)
    if (!product) return false

    this.updateCategoryCount(product.category, -1)
    this.updateTagCounts(product.tags, -1)
    
    return this.products.delete(productId)
  }

  duplicateProduct(productId: string): Product | null {
    const product = this.products.get(productId)
    if (!product) return null

    const duplicateData = {
      ...product,
      name: `${product.name} (Kopie)`,
      nameEn: `${product.nameEn} (Copy)`,
      sku: `${product.sku}-COPY-${Date.now()}`,
      seo: {
        ...product.seo,
        slug: `${product.seo.slug}-copy-${Date.now()}`,
        metaTitle: `${product.seo.metaTitle} (Kopie)`
      },
      status: 'draft' as const,
      featured: false
    }

    // Remove fields that shouldn't be duplicated
    delete (duplicateData as any).id
    delete (duplicateData as any).createdAt
    delete (duplicateData as any).updatedAt
    delete (duplicateData as any).views
    delete (duplicateData as any).sales
    delete (duplicateData as any).revenue

    return this.createProduct(duplicateData)
  }

  // Bulk Operations
  bulkUpdateProducts(productIds: string[], updates: Partial<Product>): number {
    let updatedCount = 0
    productIds.forEach(productId => {
      if (this.updateProduct(productId, updates)) {
        updatedCount++
      }
    })
    return updatedCount
  }

  bulkDeleteProducts(productIds: string[]): number {
    let deletedCount = 0
    productIds.forEach(productId => {
      if (this.deleteProduct(productId)) {
        deletedCount++
      }
    })
    return deletedCount
  }

  bulkUpdateStatus(productIds: string[], status: 'draft' | 'published' | 'private'): number {
    return this.bulkUpdateProducts(productIds, { status })
  }

  bulkUpdateCategory(productIds: string[], category: string): number {
    return this.bulkUpdateProducts(productIds, { category })
  }

  bulkUpdatePrices(productIds: string[], adjustment: { type: 'percentage' | 'absolute'; value: number }): number {
    let updatedCount = 0
    productIds.forEach(productId => {
      const product = this.products.get(productId)
      if (product) {
        let newPrice = product.price
        if (adjustment.type === 'percentage') {
          newPrice = product.price * (1 + adjustment.value / 100)
        } else {
          newPrice = product.price + adjustment.value
        }
        
        if (this.updateProduct(productId, { price: Math.max(0, newPrice) })) {
          updatedCount++
        }
      }
    })
    return updatedCount
  }

  // Search and Filter
  searchProducts(query: string, filters?: {
    category?: string
    status?: string
    featured?: boolean
    inStock?: boolean
    onSale?: boolean
  }): Product[] {
    const allProducts = Array.from(this.products.values())
    
    return allProducts.filter(product => {
      // Text search
      const matchesQuery = !query || 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.nameEn.toLowerCase().includes(query.toLowerCase()) ||
        product.sku.toLowerCase().includes(query.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))

      // Filters
      const matchesCategory = !filters?.category || product.category === filters.category
      const matchesStatus = !filters?.status || product.status === filters.status
      const matchesFeatured = filters?.featured === undefined || product.featured === filters.featured
      const matchesInStock = filters?.inStock === undefined || 
        (filters.inStock ? product.stock > 0 : product.stock === 0)
      const matchesOnSale = filters?.onSale === undefined || 
        (filters.onSale ? !!product.salePrice : !product.salePrice)

      return matchesQuery && matchesCategory && matchesStatus && 
             matchesFeatured && matchesInStock && matchesOnSale
    })
  }

  getAllProducts(sortBy?: 'name' | 'price' | 'stock' | 'created' | 'updated', sortOrder: 'asc' | 'desc' = 'desc'): Product[] {
    const products = Array.from(this.products.values())
    
    if (sortBy) {
      products.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'price':
            aValue = a.price
            bValue = b.price
            break
          case 'stock':
            aValue = a.stock
            bValue = b.stock
            break
          case 'created':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          case 'updated':
            aValue = new Date(a.updatedAt).getTime()
            bValue = new Date(b.updatedAt).getTime()
            break
          default:
            return 0
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }
    
    return products
  }

  // Category Management
  createCategory(categoryData: Omit<ProductCategory, 'id' | 'count'>): ProductCategory {
    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const category: ProductCategory = {
      ...categoryData,
      id: categoryId,
      count: 0
    }

    if (!category.slug) {
      category.slug = this.generateSlug(category.name)
    }

    this.categories.set(categoryId, category)
    return category
  }

  getCategory(categoryId: string): ProductCategory | undefined {
    return this.categories.get(categoryId)
  }

  getAllCategories(): ProductCategory[] {
    return Array.from(this.categories.values())
  }

  // Tag Management
  createTag(name: string): ProductTag {
    const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const tag: ProductTag = {
      id: tagId,
      name,
      slug: this.generateSlug(name),
      count: 0
    }

    this.tags.set(tagId, tag)
    return tag
  }

  getAllTags(): ProductTag[] {
    return Array.from(this.tags.values())
  }

  // Analytics
  getProductStats(): {
    total: number
    published: number
    draft: number
    private: number
    featured: number
    outOfStock: number
    onSale: number
  } {
    const products = Array.from(this.products.values())
    
    return {
      total: products.length,
      published: products.filter(p => p.status === 'published').length,
      draft: products.filter(p => p.status === 'draft').length,
      private: products.filter(p => p.status === 'private').length,
      featured: products.filter(p => p.featured).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      onSale: products.filter(p => !!p.salePrice).length
    }
  }

  getTopProducts(limit: number = 10): Product[] {
    return Array.from(this.products.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
  }

  getLowStockProducts(): Product[] {
    return Array.from(this.products.values())
      .filter(product => product.manageStock && product.stock <= product.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
  }

  // Utility Methods
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  private generateSKU(productName: string, category: string): string {
    const prefix = category.substring(0, 3).toUpperCase()
    const nameCode = productName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')
    const timestamp = Date.now().toString().slice(-4)
    return `${prefix}-${nameCode}-${timestamp}`
  }

  private updateCategoryCount(categoryName: string, delta: number): void {
    const category = Array.from(this.categories.values())
      .find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())
    
    if (category) {
      category.count = Math.max(0, category.count + delta)
      this.categories.set(category.id, category)
    }
  }

  private updateTagCounts(tags: string[], delta: number): void {
    tags.forEach(tagName => {
      const tag = Array.from(this.tags.values())
        .find(t => t.name.toLowerCase() === tagName.toLowerCase())
      
      if (tag) {
        tag.count = Math.max(0, tag.count + delta)
        this.tags.set(tag.id, tag)
      } else if (delta > 0) {
        // Create new tag
        this.createTag(tagName)
      }
    })
  }

  // Import/Export
  exportProducts(): Product[] {
    return Array.from(this.products.values())
  }

  importProducts(products: Product[]): number {
    let importedCount = 0
    products.forEach(product => {
      try {
        this.products.set(product.id, product)
        importedCount++
      } catch (error) {
        console.error(`Failed to import product ${product.id}:`, error)
      }
    })
    return importedCount
  }

  // Validation
  validateProduct(product: Partial<Product>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!product.name?.trim()) {
      errors.push('Produktname ist erforderlich')
    }

    if (!product.sku?.trim()) {
      errors.push('SKU ist erforderlich')
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      errors.push('Gültiger Preis ist erforderlich')
    }

    if (!product.category?.trim()) {
      errors.push('Kategorie ist erforderlich')
    }

    if (product.salePrice && product.salePrice >= (product.price || 0)) {
      errors.push('Angebotspreis muss niedriger als der reguläre Preis sein')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Singleton instance
export const productManager = ProductManager.getInstance()