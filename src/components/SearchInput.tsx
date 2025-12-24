'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  category: string
}

export default function SearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query.trim())
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.products || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Produkte suchen..."
          className="w-64 px-4 py-2 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {product.salePrice ? (
                        <>
                          <span className="text-sm font-semibold text-red-600">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {query.trim() && (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  className="block p-3 text-center text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-200"
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  Alle Ergebnisse für "{query}" anzeigen
                </Link>
              )}
            </>
          ) : query.trim().length > 2 && !loading ? (
            <div className="p-4 text-center text-gray-500">
              <p>Keine Produkte gefunden für "{query}"</p>
              <Link
                href="/products"
                className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                onClick={() => {
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                Alle Produkte durchsuchen
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}