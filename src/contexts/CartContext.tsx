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

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isLoading: boolean
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
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  // Load cart from localStorage or server
  useEffect(() => {
    setMounted(true)
    const savedCart = localStorage.getItem('attireburg_cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('attireburg_cart', JSON.stringify(items))
  }, [items])

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

      setItems(prev => {
        // Check for existing item - include variantId and backorder status in comparison
        const existingItem = prev.find(
          item => item.productId === newItem.productId && 
                  item.size === newItem.size && 
                  item.color === newItem.color &&
                  item.variantId === newItem.variantId &&
                  item.isBackorder === newItem.isBackorder
        )

        if (existingItem) {
          const newQuantity = existingItem.quantity + newItem.quantity
          
          // Check if new quantity exceeds stock (only for regular items)
          if (!newItem.isBackorder && newQuantity > newItem.stock) {
            throw new Error(`Nur ${newItem.stock} Stück verfügbar`)
          }
          
          return prev.map(item =>
            item.id === existingItem.id
              ? { ...item, quantity: newQuantity }
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
  }

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0
  const totalPrice = mounted ? items.reduce((sum, item) => {
    const price = item.salePrice || item.price
    return sum + (price * item.quantity)
  }, 0) : 0

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
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)