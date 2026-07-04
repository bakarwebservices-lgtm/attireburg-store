'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  image: string
  size: string
  color?: string
  quantity: number
  stock: number
  attributes?: Record<string, string>
  isBackorder?: boolean
  expectedFulfillmentDate?: Date
}

export interface AppliedCoupon {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isLoading: boolean
  appliedCoupon: AppliedCoupon | null
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void
  discountedTotal: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  appliedCoupon: null,
  setAppliedCoupon: () => {},
  discountedTotal: 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null)
  const { user } = useAuth()

  // Load cart and coupon from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('attireburg_cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
    const savedCoupon = localStorage.getItem('attireburg_coupon')
    if (savedCoupon) {
      try {
        setAppliedCouponState(JSON.parse(savedCoupon))
      } catch {
        // ignore
      }
    }
    setMounted(true)
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('attireburg_cart', JSON.stringify(items))
    }
  }, [items, mounted])

  const setAppliedCoupon = (coupon: AppliedCoupon | null) => {
    setAppliedCouponState(coupon)
    if (coupon) {
      localStorage.setItem('attireburg_coupon', JSON.stringify(coupon))
    } else {
      localStorage.removeItem('attireburg_coupon')
    }
  }

  const addItem = async (newItem: Omit<CartItem, 'id'>) => {
    setIsLoading(true)
    
    try {
      // Skip stock check for backorder items
      if (!newItem.isBackorder) {
        // Check stock availability before adding to cart
        const stockCheckResponse = await fetch('/api/inventory/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              productId: newItem.productId,
              variantId: newItem.variantId,
              quantity: newItem.quantity
            }]
          })
        })

        if (stockCheckResponse.ok) {
          const stockData = await stockCheckResponse.json()
          
          if (!stockData.available) {
            const unavailable = stockData.unavailableItems[0]
            throw new Error(`Nur ${unavailable.available} Stück verfügbar`)
          }
        }
      }

      // Check existing item quantity BEFORE calling setItems
      // Throwing inside a setState updater causes an unhandled client-side error
      const currentItems = items
      const existingItem = currentItems.find(
        item => item.productId === newItem.productId &&
                item.size === newItem.size &&
                item.color === newItem.color &&
                item.variantId === newItem.variantId &&
                item.isBackorder === newItem.isBackorder
      )

      if (existingItem && !newItem.isBackorder) {
        const newQuantity = existingItem.quantity + newItem.quantity
        if (newQuantity > newItem.stock) {
          const remaining = newItem.stock - existingItem.quantity
          if (remaining <= 0) {
            throw new Error(`Maximale Menge (${newItem.stock} Stück) bereits im Warenkorb`)
          }
          throw new Error(`Nur noch ${remaining} weitere Stück verfügbar`)
        }
      }

      setItems(prev => {
        const existing = prev.find(
          item => item.productId === newItem.productId &&
                  item.size === newItem.size &&
                  item.color === newItem.color &&
                  item.variantId === newItem.variantId &&
                  item.isBackorder === newItem.isBackorder
        )

        if (existing) {
          return prev.map(item =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          )
        }

        return [...prev, { ...newItem, id: Date.now().toString() }]
      })
    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error // Re-throw so the UI can handle it
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    setAppliedCoupon(null)
  }

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0
  const totalPrice = mounted ? items.reduce((sum, item) => {
    const price = item.salePrice || item.price
    return sum + (price * item.quantity)
  }, 0) : 0
  const discountedTotal = mounted && appliedCoupon
    ? Math.max(0, totalPrice - appliedCoupon.discountAmount)
    : totalPrice

  return (
    <CartContext.Provider value={{
      items: mounted ? items : [],
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isLoading,
      appliedCoupon: mounted ? appliedCoupon : null,
      setAppliedCoupon,
      discountedTotal,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)