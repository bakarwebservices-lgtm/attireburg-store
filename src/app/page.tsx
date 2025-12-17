'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { translations } from '@/lib/translations'
import { useLanguage } from '@/components/ClientLayout'
import { formatPriceWithVAT } from '@/lib/vat'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  avgRating: number
  reviewCount: number
  onSale: boolean
}

export default function Home() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=3')
      const data = await response.json()
      setFeaturedProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-100 to-primary-50 py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-primary-800 mb-6">
            {t.home.hero}
          </h1>
          <p className="text-xl md:text-2xl text-primary-600 mb-10">
            {t.home.subtitle}
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t.home.shopNow}
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-primary-800 text-center mb-12">
            {t.home.featured}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-50 rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-primary-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-primary-200 rounded mb-2"></div>
                    <div className="h-4 bg-primary-200 rounded mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-20 bg-primary-200 rounded"></div>
                      <div className="h-10 w-32 bg-primary-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="group bg-primary-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center relative overflow-hidden">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={lang === 'de' ? product.name : product.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-primary-400 text-lg">Kein Bild</span>
                        )}
                        {product.onSale && (
                          <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                            Sale
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-800 mb-2">
                          {lang === 'de' ? product.name : product.nameEn}
                        </h3>
                        <div className="flex items-center mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.avgRating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              ({product.reviewCount})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="space-y-1">
                              {product.onSale && product.salePrice ? (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-red-600">
                                      {formatPriceWithVAT(product.salePrice, lang).price}
                                    </span>
                                    <span className="text-lg text-gray-500 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {formatPriceWithVAT(product.salePrice, lang).vatInfo}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold text-primary-700">
                                    {formatPriceWithVAT(product.price, lang).price}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {formatPriceWithVAT(product.price, lang).vatInfo}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors">
                            {t.products.addToCart}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-primary-600 text-lg">{t.home.noFeaturedProducts}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary-800 mb-6">
            {t.footer.about}
          </h2>
          <p className="text-lg text-primary-700 leading-relaxed">
            Attireburg ist eine Premium-Bekleidungsmarke aus Deutschland, die sich auf hochwertige Pullover und Jacken spezialisiert hat. Wir verbinden zeitloses Design mit erstklassiger Qualität.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-800 mb-4">
            {t.home.newsletter.title}
          </h2>
          <p className="text-primary-600 mb-8">
            {t.home.newsletter.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t.home.newsletter.placeholder}
              className="flex-1 px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold">
              {t.home.newsletter.button}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}