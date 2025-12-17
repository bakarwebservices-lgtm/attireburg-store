'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface WishlistItem {
  id: string
  productId: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  image: string
  category: string
  stock: number
  onSale: boolean
  addedDate: string
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
    
    // Simulate loading wishlist items
    setTimeout(() => {
      setWishlistItems([
        {
          id: '1',
          productId: '1',
          name: 'Premium Wollpullover Classic',
          nameEn: 'Premium Wool Sweater Classic',
          price: 129.99,
          image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
          category: 'pullover',
          stock: 25,
          onSale: false,
          addedDate: '2024-01-10'
        },
        {
          id: '2',
          productId: '2',
          name: 'Winterjacke Alpine Pro',
          nameEn: 'Winter Jacket Alpine Pro',
          price: 299.99,
          salePrice: 249.99,
          image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
          category: 'jacken',
          stock: 15,
          onSale: true,
          addedDate: '2024-01-15'
        },
        {
          id: '3',
          productId: '8',
          name: 'Pullover Merino Deluxe',
          nameEn: 'Sweater Merino Deluxe',
          price: 189.99,
          image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
          category: 'pullover',
          stock: 0,
          onSale: false,
          addedDate: '2024-01-20'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleAddToCart = (item: WishlistItem) => {
    if (item.stock === 0) return
    
    addItem({
      productId: item.productId,
      name: item.name,
      nameEn: item.nameEn,
      price: item.price,
      salePrice: item.salePrice,
      image: item.image,
      size: '',
      color: '',
      quantity: 1,
      stock: item.stock
    })
    
    // Show success message
    alert('Produkt wurde zum Warenkorb hinzugefügt!')
  }

  const handleRemoveFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId))
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
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <Link href={`/products/${item.productId}`}>
                    <img
                      src={item.image}
                      alt={lang === 'de' ? item.name : item.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  
                  {/* Remove from wishlist button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Sale badge */}
                  {item.onSale && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Sale
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">Ausverkauft</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                      {lang === 'de' ? item.name : item.nameEn}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-500 mb-3 capitalize">
                    {item.category}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {item.onSale && item.salePrice ? (
                        <>
                          <span className="font-bold text-red-600">
                            {formatPrice(item.salePrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-primary-700">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {item.stock === 0 ? 'Ausverkauft' : 'In den Warenkorb'}
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Hinzugefügt am {new Date(item.addedDate).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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