'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

interface Product {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  price: number
  salePrice?: number
  images: string[]
  category: string
  stock: number
  avgRating: number
  reviewCount: number
  onSale: boolean
}

export default function SearchPage() {
  const { lang } = useLanguage()
  const searchParams = useSearchParams()
  const t = translations[lang]
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('relevance')

  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery, currentPage, sortBy)
    } else {
      setLoading(false)
    }
  }, [searchQuery, currentPage, sortBy])

  const performSearch = async (searchQuery: string, page: number = 1, sort: string = 'relevance') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: page.toString(),
        limit: '12',
        sortBy: sort === 'relevance' ? 'createdAt' : sort,
        sortOrder: sort === 'price_asc' ? 'asc' : 'desc'
      })

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalResults(data.total || 0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(query.trim())}`)
      setCurrentPage(1)
      performSearch(query.trim(), 1, sortBy)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const totalPages = Math.ceil(totalResults / 12)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Produktsuche</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nach Produkten suchen..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Suchen
              </button>
            </div>
          </form>

          {/* Results Info */}
          {searchQuery && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {loading ? 'Suche läuft...' : `${totalResults} Ergebnisse für "${searchQuery}"`}
              </p>
              
              {/* Sort Options */}
              {!loading && totalResults > 0 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Sortieren:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="relevance">Relevanz</option>
                    <option value="price_asc">Preis aufsteigend</option>
                    <option value="price_desc">Preis absteigend</option>
                    <option value="name">Name A-Z</option>
                    <option value="createdAt">Neueste zuerst</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-4 text-gray-600">Suche läuft...</span>
          </div>
        ) : searchQuery && products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Produkte gefunden</h3>
            <p className="text-gray-600 mb-6">
              Für "{searchQuery}" wurden keine Produkte gefunden. Versuchen Sie es mit anderen Suchbegriffen.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Alle Produkte durchsuchen
            </Link>
          </div>
        ) : searchQuery ? (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {lang === 'de' ? product.name : product.nameEn}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(product.salePrice)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      
                      {product.stock === 0 && (
                        <span className="text-xs text-red-600 font-medium">
                          Ausverkauft
                        </span>
                      )}
                    </div>
                    
                    {product.reviewCount > 0 && (
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.avgRating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Zurück
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Produktsuche</h3>
            <p className="text-gray-600 mb-6">
              Geben Sie einen Suchbegriff ein, um Produkte zu finden.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Alle Produkte durchsuchen
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}