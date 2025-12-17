// Data Storage Management for Admin Portal
// This handles local storage, session storage, and future database integration

export interface StorageConfig {
  prefix: string
  version: string
  encryption?: boolean
}

export class DataStorage {
  private static instance: DataStorage
  private config: StorageConfig
  private cache: Map<string, any> = new Map()

  constructor(config: StorageConfig = { prefix: 'attireburg_admin', version: '1.0' }) {
    this.config = config
  }

  static getInstance(config?: StorageConfig): DataStorage {
    if (!DataStorage.instance) {
      DataStorage.instance = new DataStorage(config)
    }
    return DataStorage.instance
  }

  // Local Storage Operations
  setLocal<T>(key: string, data: T): boolean {
    try {
      const storageKey = this.getStorageKey(key)
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.config.version
      })
      
      localStorage.setItem(storageKey, serializedData)
      this.cache.set(key, data)
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }

  getLocal<T>(key: string): T | null {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key)
      }

      const storageKey = this.getStorageKey(key)
      const serializedData = localStorage.getItem(storageKey)
      
      if (!serializedData) return null

      const parsed = JSON.parse(serializedData)
      
      // Version check
      if (parsed.version !== this.config.version) {
        this.removeLocal(key)
        return null
      }

      this.cache.set(key, parsed.data)
      return parsed.data
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return null
    }
  }

  removeLocal(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key)
      localStorage.removeItem(storageKey)
      this.cache.delete(key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  }

  // Session Storage Operations
  setSession<T>(key: string, data: T): boolean {
    try {
      const storageKey = this.getStorageKey(key)
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.config.version
      })
      
      sessionStorage.setItem(storageKey, serializedData)
      return true
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error)
      return false
    }
  }

  getSession<T>(key: string): T | null {
    try {
      const storageKey = this.getStorageKey(key)
      const serializedData = sessionStorage.getItem(storageKey)
      
      if (!serializedData) return null

      const parsed = JSON.parse(serializedData)
      
      // Version check
      if (parsed.version !== this.config.version) {
        this.removeSession(key)
        return null
      }

      return parsed.data
    } catch (error) {
      console.error('Failed to read from sessionStorage:', error)
      return null
    }
  }

  removeSession(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key)
      sessionStorage.removeItem(storageKey)
      return true
    } catch (error) {
      console.error('Failed to remove from sessionStorage:', error)
      return false
    }
  }

  // Bulk Operations
  setBulk<T>(items: Array<{ key: string; data: T }>, useSession: boolean = false): number {
    let successCount = 0
    items.forEach(({ key, data }) => {
      const success = useSession ? this.setSession(key, data) : this.setLocal(key, data)
      if (success) successCount++
    })
    return successCount
  }

  getBulk<T>(keys: string[], useSession: boolean = false): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: useSession ? this.getSession<T>(key) : this.getLocal<T>(key)
    }))
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }

  getCacheKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Storage Info
  getStorageInfo(): {
    localStorage: { used: number; available: number; keys: string[] }
    sessionStorage: { used: number; available: number; keys: string[] }
    cache: { size: number; keys: string[] }
  } {
    const getStorageSize = (storage: Storage) => {
      let total = 0
      const keys: string[] = []
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(this.config.prefix)) {
          keys.push(key)
          total += (storage.getItem(key) || '').length
        }
      }
      
      return { used: total, keys }
    }

    const localInfo = getStorageSize(localStorage)
    const sessionInfo = getStorageSize(sessionStorage)

    return {
      localStorage: {
        ...localInfo,
        available: 5 * 1024 * 1024 - localInfo.used // Approximate 5MB limit
      },
      sessionStorage: {
        ...sessionInfo,
        available: 5 * 1024 * 1024 - sessionInfo.used
      },
      cache: {
        size: this.cache.size,
        keys: this.getCacheKeys()
      }
    }
  }

  // Cleanup Operations
  clearExpired(maxAge: number = 7 * 24 * 60 * 60 * 1000): number { // Default 7 days
    let cleanedCount = 0
    const now = Date.now()

    // Clean localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const parsed = JSON.parse(data)
            if (now - parsed.timestamp > maxAge) {
              localStorage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key)
          cleanedCount++
        }
      }
    }

    // Clean sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        try {
          const data = sessionStorage.getItem(key)
          if (data) {
            const parsed = JSON.parse(data)
            if (now - parsed.timestamp > maxAge) {
              sessionStorage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (error) {
          sessionStorage.removeItem(key)
          cleanedCount++
        }
      }
    }

    return cleanedCount
  }

  clearAll(): void {
    // Clear localStorage
    const localKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        localKeys.push(key)
      }
    }
    localKeys.forEach(key => localStorage.removeItem(key))

    // Clear sessionStorage
    const sessionKeys = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        sessionKeys.push(key)
      }
    }
    sessionKeys.forEach(key => sessionStorage.removeItem(key))

    // Clear cache
    this.clearCache()
  }

  // Export/Import for backup
  exportData(): { localStorage: any; sessionStorage: any } {
    const localData: any = {}
    const sessionData: any = {}

    // Export localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        localData[key] = localStorage.getItem(key)
      }
    }

    // Export sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.config.prefix)) {
        sessionData[key] = sessionStorage.getItem(key)
      }
    }

    return { localStorage: localData, sessionStorage: sessionData }
  }

  importData(data: { localStorage?: any; sessionStorage?: any }): { imported: number; errors: number } {
    let imported = 0
    let errors = 0

    // Import localStorage
    if (data.localStorage) {
      Object.entries(data.localStorage).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value as string)
          imported++
        } catch (error) {
          errors++
        }
      })
    }

    // Import sessionStorage
    if (data.sessionStorage) {
      Object.entries(data.sessionStorage).forEach(([key, value]) => {
        try {
          sessionStorage.setItem(key, value as string)
          imported++
        } catch (error) {
          errors++
        }
      })
    }

    return { imported, errors }
  }

  // Utility Methods
  private getStorageKey(key: string): string {
    return `${this.config.prefix}_${key}`
  }

  // Future database integration methods
  async syncToDatabase(): Promise<boolean> {
    // TODO: Implement database sync when database is integrated
    console.log('Database sync not yet implemented')
    return false
  }

  async loadFromDatabase(): Promise<boolean> {
    // TODO: Implement database loading when database is integrated
    console.log('Database loading not yet implemented')
    return false
  }
}

// Predefined storage keys for consistency
export const STORAGE_KEYS = {
  // Products
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'product_categories',
  PRODUCT_TAGS: 'product_tags',
  PRODUCT_ATTRIBUTES: 'product_attributes',
  
  // Media
  MEDIA_FILES: 'media_files',
  MEDIA_FOLDERS: 'media_folders',
  
  // Orders
  ORDERS: 'orders',
  ORDER_STATUSES: 'order_statuses',
  
  // Users
  USERS: 'users',
  USER_ROLES: 'user_roles',
  
  // Settings
  ADMIN_SETTINGS: 'admin_settings',
  STORE_SETTINGS: 'store_settings',
  
  // Analytics
  ANALYTICS_DATA: 'analytics_data',
  REPORTS: 'reports',
  
  // UI State
  UI_PREFERENCES: 'ui_preferences',
  DASHBOARD_LAYOUT: 'dashboard_layout',
  
  // Cache
  API_CACHE: 'api_cache',
  SEARCH_CACHE: 'search_cache'
} as const

// Singleton instance
export const dataStorage = DataStorage.getInstance()

// Helper functions for common operations
export const saveAdminData = <T>(key: string, data: T): boolean => {
  return dataStorage.setLocal(key, data)
}

export const loadAdminData = <T>(key: string): T | null => {
  return dataStorage.getLocal<T>(key)
}

export const saveSessionData = <T>(key: string, data: T): boolean => {
  return dataStorage.setSession(key, data)
}

export const loadSessionData = <T>(key: string): T | null => {
  return dataStorage.getSession<T>(key)
}