// Admin Data Initialization and Management
// This file initializes sample data for the admin portal and manages data persistence

import { productManager, Product, ProductCategory } from './productManager'
import { mediaManager, MediaFile, MediaFolder } from './mediaManager'
import { dataStorage, STORAGE_KEYS } from './dataStorage'

export interface AdminDataState {
  initialized: boolean
  version: string
  lastUpdated: string
}

export class AdminDataManager {
  private static instance: AdminDataManager
  private initialized = false

  static getInstance(): AdminDataManager {
    if (!AdminDataManager.instance) {
      AdminDataManager.instance = new AdminDataManager()
    }
    return AdminDataManager.instance
  }

  async initializeAdminData(): Promise<boolean> {
    if (this.initialized) return true

    try {
      // Check if data already exists
      const existingState = dataStorage.getLocal<AdminDataState>('admin_state')
      
      if (existingState && existingState.initialized) {
        // Load existing data
        await this.loadExistingData()
      } else {
        // Initialize with sample data
        await this.initializeSampleData()
        
        // Save state
        const state: AdminDataState = {
          initialized: true,
          version: '1.0.0',
          lastUpdated: new Date().toISOString()
        }
        dataStorage.setLocal('admin_state', state)
      }

      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize admin data:', error)
      return false
    }
  }

  private async loadExistingData(): Promise<void> {
    // Load products
    const products = dataStorage.getLocal<Product[]>(STORAGE_KEYS.PRODUCTS)
    if (products) {
      productManager.importProducts(products)
    }

    // Load categories
    const categories = dataStorage.getLocal<ProductCategory[]>(STORAGE_KEYS.PRODUCT_CATEGORIES)
    if (categories) {
      categories.forEach(category => {
        // Re-create categories in product manager
        productManager.createCategory(category)
      })
    }

    // Load media files
    const mediaData = dataStorage.getLocal<{ files: MediaFile[]; folders: MediaFolder[] }>('media_data')
    if (mediaData) {
      mediaManager.importData(mediaData)
    }
  }

  private async initializeSampleData(): Promise<void> {
    // Initialize sample categories
    const categories = [
      {
        name: 'Pullover',
        nameEn: 'Sweaters',
        slug: 'pullover',
        description: 'Hochwertige Pullover aus besten Materialien',
        descriptionEn: 'High-quality sweaters made from the finest materials',
        menuOrder: 1
      },
      {
        name: 'Jacken',
        nameEn: 'Jackets',
        slug: 'jacken',
        description: 'Warme und stilvolle Jacken für jede Jahreszeit',
        descriptionEn: 'Warm and stylish jackets for every season',
        menuOrder: 2
      },
      {
        name: 'Hoodies',
        nameEn: 'Hoodies',
        slug: 'hoodies',
        description: 'Bequeme Hoodies für den Alltag',
        descriptionEn: 'Comfortable hoodies for everyday wear',
        menuOrder: 3
      },
      {
        name: 'Shirts',
        nameEn: 'Shirts',
        slug: 'shirts',
        description: 'Klassische und moderne Shirts',
        descriptionEn: 'Classic and modern shirts',
        menuOrder: 4
      }
    ]

    categories.forEach(categoryData => {
      productManager.createCategory(categoryData)
    })

    // Initialize sample products
    const sampleProducts = [
      {
        name: 'Premium Wollpullover Classic',
        nameEn: 'Premium Wool Sweater Classic',
        description: 'Ein zeitloser Wollpullover aus hochwertigen Materialien. Perfekt für die kalte Jahreszeit und stilvolle Anlässe. Hergestellt in Deutschland mit größter Sorgfalt.',
        descriptionEn: 'A timeless wool sweater made from high-quality materials. Perfect for the cold season and stylish occasions. Made in Germany with the utmost care.',
        shortDescription: 'Zeitloser Wollpullover aus hochwertigen Materialien',
        shortDescriptionEn: 'Timeless wool sweater made from high-quality materials',
        price: 129.99,
        salePrice: 99.99,
        costPrice: 65.00,
        sku: 'ATB-PULL-001',
        manageStock: true,
        stock: 15,
        lowStockThreshold: 5,
        backordersAllowed: false,
        weight: 0.8,
        dimensions: { length: 30, width: 25, height: 5 },
        shippingClass: 'standard',
        category: 'pullover',
        tags: ['premium', 'wolle', 'winter', 'klassisch'],
        images: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop'
        ],
        gallery: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop'
        ],
        attributes: [
          {
            name: 'Größe',
            values: ['S', 'M', 'L', 'XL'],
            variation: true,
            visible: true
          },
          {
            name: 'Farbe',
            values: ['Schwarz', 'Grau', 'Navy'],
            variation: true,
            visible: true
          },
          {
            name: 'Material',
            values: ['100% Merinowolle'],
            variation: false,
            visible: true
          }
        ],
        variations: [],
        seo: {
          metaTitle: 'Premium Wollpullover Classic - Hochwertige deutsche Kleidung',
          metaDescription: 'Entdecken Sie unseren Premium Wollpullover aus hochwertigen Materialien. Zeitloses Design trifft auf deutsche Qualität. Jetzt bestellen!',
          focusKeyword: 'premium wollpullover',
          slug: 'premium-wollpullover-classic'
        },
        status: 'published' as const,
        featured: true,
        catalogVisibility: 'visible' as const,
        purchaseNote: 'Bitte beachten Sie die Pflegehinweise für beste Langlebigkeit.',
        menuOrder: 0,
        enableReviews: true,
        dateOnSaleFrom: '2024-01-01T00:00:00Z',
        dateOnSaleTo: '2024-02-29T23:59:59Z',
        avgRating: 4.8,
        reviewCount: 24
      },
      {
        name: 'Winterjacke Alpine Pro',
        nameEn: 'Alpine Pro Winter Jacket',
        description: 'Professionelle Winterjacke für extreme Wetterbedingungen. Wasserdicht, winddicht und atmungsaktiv. Mit hochwertiger Daunenfüllung für optimale Wärmeisolierung.',
        descriptionEn: 'Professional winter jacket for extreme weather conditions. Waterproof, windproof and breathable. With high-quality down filling for optimal thermal insulation.',
        shortDescription: 'Professionelle Winterjacke für extreme Bedingungen',
        shortDescriptionEn: 'Professional winter jacket for extreme conditions',
        price: 299.99,
        salePrice: 249.99,
        costPrice: 180.00,
        sku: 'ATB-JACK-001',
        manageStock: true,
        stock: 8,
        lowStockThreshold: 3,
        backordersAllowed: true,
        weight: 1.2,
        dimensions: { length: 35, width: 30, height: 8 },
        shippingClass: 'standard',
        category: 'jacken',
        tags: ['winter', 'outdoor', 'wasserdicht', 'daunen'],
        images: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop'
        ],
        gallery: [
          'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop'
        ],
        attributes: [
          {
            name: 'Größe',
            values: ['S', 'M', 'L', 'XL', 'XXL'],
            variation: true,
            visible: true
          },
          {
            name: 'Farbe',
            values: ['Schwarz', 'Navy', 'Grün'],
            variation: true,
            visible: true
          }
        ],
        variations: [],
        seo: {
          metaTitle: 'Alpine Pro Winterjacke - Professionelle Outdoor-Bekleidung',
          metaDescription: 'Hochwertige Winterjacke für extreme Bedingungen. Wasserdicht, atmungsaktiv und warm. Perfekt für Outdoor-Aktivitäten.',
          focusKeyword: 'winterjacke outdoor',
          slug: 'winterjacke-alpine-pro'
        },
        status: 'published' as const,
        featured: true,
        catalogVisibility: 'visible' as const,
        purchaseNote: '',
        menuOrder: 0,
        enableReviews: true,
        avgRating: 4.6,
        reviewCount: 18
      },
      {
        name: 'Hoodie Urban Comfort',
        nameEn: 'Urban Comfort Hoodie',
        description: 'Bequemer Hoodie für den Alltag. Aus weicher Baumwoll-Mischung gefertigt. Perfekt für entspannte Tage und sportliche Aktivitäten.',
        descriptionEn: 'Comfortable hoodie for everyday wear. Made from soft cotton blend. Perfect for relaxed days and sports activities.',
        shortDescription: 'Bequemer Hoodie aus weicher Baumwoll-Mischung',
        shortDescriptionEn: 'Comfortable hoodie made from soft cotton blend',
        price: 89.99,
        costPrice: 45.00,
        sku: 'ATB-HOOD-001',
        manageStock: true,
        stock: 0,
        lowStockThreshold: 5,
        backordersAllowed: false,
        weight: 0.6,
        shippingClass: 'standard',
        category: 'hoodies',
        tags: ['comfort', 'baumwolle', 'casual', 'sport'],
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop'
        ],
        gallery: [],
        attributes: [
          {
            name: 'Größe',
            values: ['S', 'M', 'L', 'XL'],
            variation: true,
            visible: true
          },
          {
            name: 'Farbe',
            values: ['Grau', 'Schwarz', 'Weiß'],
            variation: true,
            visible: true
          }
        ],
        variations: [],
        seo: {
          metaTitle: 'Urban Comfort Hoodie - Bequeme Alltagskleidung',
          metaDescription: 'Bequemer Hoodie aus weicher Baumwoll-Mischung. Perfekt für entspannte Tage und sportliche Aktivitäten.',
          focusKeyword: 'hoodie baumwolle',
          slug: 'hoodie-urban-comfort'
        },
        status: 'draft' as const,
        featured: false,
        catalogVisibility: 'visible' as const,
        purchaseNote: '',
        menuOrder: 0,
        enableReviews: true,
        avgRating: 4.2,
        reviewCount: 12
      }
    ]

    // Create sample products
    sampleProducts.forEach(productData => {
      productManager.createProduct(productData)
    })

    // Initialize sample media folders
    const mediaFolders = [
      { name: 'Produktbilder', parentId: undefined },
      { name: 'Kategoriebilder', parentId: undefined },
      { name: 'Banner & Marketing', parentId: undefined },
      { name: 'Dokumente', parentId: undefined }
    ]

    mediaFolders.forEach(folderData => {
      mediaManager.createFolder(folderData.name, folderData.parentId)
    })

    // Save initialized data
    await this.saveAllData()
  }

  async saveAllData(): Promise<void> {
    // Save products
    const products = productManager.exportProducts()
    dataStorage.setLocal(STORAGE_KEYS.PRODUCTS, products)

    // Save categories
    const categories = productManager.getAllCategories()
    dataStorage.setLocal(STORAGE_KEYS.PRODUCT_CATEGORIES, categories)

    // Save tags
    const tags = productManager.getAllTags()
    dataStorage.setLocal(STORAGE_KEYS.PRODUCT_TAGS, tags)

    // Save media data
    const mediaData = mediaManager.exportData()
    dataStorage.setLocal('media_data', mediaData)

    // Update state
    const state: AdminDataState = {
      initialized: true,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
    dataStorage.setLocal('admin_state', state)
  }

  async resetAllData(): Promise<void> {
    // Clear all storage
    dataStorage.clearAll()
    
    // Reset managers
    productManager.importProducts([])
    mediaManager.importData({ files: [], folders: [] })
    
    // Re-initialize
    this.initialized = false
    await this.initializeSampleData()
  }

  getDataStats(): {
    products: number
    categories: number
    tags: number
    mediaFiles: number
    mediaFolders: number
    storageUsed: number
  } {
    const storageInfo = dataStorage.getStorageInfo()
    
    return {
      products: productManager.exportProducts().length,
      categories: productManager.getAllCategories().length,
      tags: productManager.getAllTags().length,
      mediaFiles: mediaManager.exportData().files.length,
      mediaFolders: mediaManager.exportData().folders.length,
      storageUsed: storageInfo.localStorage.used
    }
  }

  async exportAllData(): Promise<{
    products: Product[]
    categories: ProductCategory[]
    mediaData: { files: MediaFile[]; folders: MediaFolder[] }
    metadata: {
      exportDate: string
      version: string
      stats: any
    }
  }> {
    return {
      products: productManager.exportProducts(),
      categories: productManager.getAllCategories(),
      mediaData: mediaManager.exportData(),
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        stats: this.getDataStats()
      }
    }
  }

  async importAllData(data: any): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Import products
      if (data.products) {
        productManager.importProducts(data.products)
      }

      // Import categories
      if (data.categories) {
        data.categories.forEach((category: ProductCategory) => {
          try {
            productManager.createCategory(category)
          } catch (error) {
            errors.push(`Failed to import category: ${category.name}`)
          }
        })
      }

      // Import media data
      if (data.mediaData) {
        mediaManager.importData(data.mediaData)
      }

      // Save imported data
      await this.saveAllData()

      return { success: errors.length === 0, errors }
    } catch (error) {
      errors.push(`Import failed: ${error}`)
      return { success: false, errors }
    }
  }
}

// Singleton instance
export const adminDataManager = AdminDataManager.getInstance()

// Auto-initialize when imported
adminDataManager.initializeAdminData().then(success => {
  if (success) {
    console.log('✅ Admin data initialized successfully')
  } else {
    console.error('❌ Failed to initialize admin data')
  }
})