'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'
import { getSession } from '@/lib/session'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  category: string
  stock: number
  onSale: boolean
}

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: Product
}

export default function UserWishlist() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()
  const t = translations[lang]
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    fetchWishlist()
  }, [user, router])

  const fetchWishlist = async () => {
    try {
      const session = getSession()
      if (!session?.token) return

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.wishlist || [])
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product || item.product.stock === 0) return
    
    addItem({
      productId: item.productId,
      name: item.product.name,
      nameEn: item.product.nameEn,
      price: item.product.price,
      salePrice: item.product.salePrice,
      image: item.product.images[0] || '',
      size: '',
      color: '',
      quantity: 1,
      stock: item.product.stock
    })
    
    // Show success message
    alert('Produkt wurde zum Warenkorb hinzugefügt!')
  }

  const handleRemoveFromWishlist = async (itemId: string, productId: string) => {
    try {
      const session = getSession()
      if (!session?.token) return

      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      })

      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId))
        alert('Produkt von der Wunschliste entfernt')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      alert('Fehler beim Entfernen von der Wunschliste')
    }
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t.dashboard.wishlist}
              </h2>
              <p className="text-gray-600 mt-1">
                Ihre gespeicherten Lieblingsstücke
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'Artikel' : 'Artikel'}
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              if (!item.product) return null

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Link href={`/products/${item.productId}`}>
                      {item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={lang === 'de' ? item.product.name : item.product.nameEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    
                    {/* Remove from wishlist button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id, item.productId)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Sale badge */}
                    {item.product.salePrice && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Sale
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {item.product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Ausverkauft</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <Link href={`/products/${item.productId}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                        {lang === 'de' ? item.product.name : item.product.nameEn}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-500 mb-3 capitalize">
                      {item.product.category}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {item.product.salePrice ? (
                          <>
                            <span className="font-bold text-red-600">
                              {formatPrice(item.product.salePrice)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary-700">
                            {formatPrice(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.product.stock === 0}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {item.product.stock === 0 ? 'Ausverkauft' : 'In den Warenkorb'}
                      </button>
                      
                      <p className="text-xs text-gray-500 text-center">
                        Hinzugefügt am {new Date(item.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ihre Wunschliste ist leer
            </h3>
            <p className="text-gray-600 mb-6">
              Speichern Sie Ihre Lieblingsstücke für später
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Produkte entdecken
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}