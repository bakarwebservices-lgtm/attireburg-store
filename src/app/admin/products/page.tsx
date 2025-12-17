'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'
import { sampleProducts } from '@/lib/sampleData'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  category: string
  stock: number
  featured: boolean
  onSale: boolean
  isActive: boolean
  images: string[]
  createdAt: string
}

export default function AdminProducts() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }
    
    // Load products from sample data
    setTimeout(() => {
      const productsWithDates = sampleProducts.map(product => ({
        ...product,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))
      setProducts(productsWithDates)
      setLoading(false)
    }, 1000)
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm(t.admin.confirmDelete)) {
      setProducts(prev => prev.filter(p => p.id !== productId))
      alert(t.admin.productDeleted)
    }
  }

  const handleToggleActive = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isActive: !p.isActive } : p
    ))
  }

  const handleToggleFeatured = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, featured: !p.featured } : p
    ))
  }

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && product.isActive) ||
      (filter === 'inactive' && !product.isActive) ||
      (filter === 'featured' && product.featured) ||
      (filter === 'sale' && product.onSale) ||
      (filter === 'low-stock' && product.stock < 10)
    
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (!user || !user.isAdmin) {
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
                {t.admin.products}
              </h2>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Ihr Produktsortiment
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {t.admin.addProduct}
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.search}
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Produktname suchen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.filter}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="all">Alle Produkte</option>
                <option value="active">Aktive Produkte</option>
                <option value="inactive">Inaktive Produkte</option>
                <option value="featured">Ausgewählte Produkte</option>
                <option value="sale">Im Angebot</option>
                <option value="low-stock">Niedriger Lagerbestand</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} von {products.length} Produkten
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            {product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Kein Bild
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.nameEn}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {product.featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Ausgewählt
                                </span>
                              )}
                              {product.onSale && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Sale
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.onSale && product.salePrice ? (
                            <div>
                              <span className="font-semibold text-red-600">
                                {formatPrice(product.salePrice)}
                              </span>
                              <span className="text-gray-500 line-through ml-2">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          product.stock < 10 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.isActive ? 'Aktiv' : 'Inaktiv'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            {t.common.edit}
                          </Link>
                          <button
                            onClick={() => handleToggleFeatured(product.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            {product.featured ? 'Nicht ausgewählt' : 'Ausgewählt'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Keine Produkte gefunden
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {search || filter !== 'all' 
                      ? 'Versuchen Sie, Ihre Filter zu ändern.'
                      : 'Erstellen Sie Ihr erstes Produkt.'
                    }
                  </p>
                  {(!search && filter === 'all') && (
                    <Link
                      href="/admin/products/new"
                      className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      {t.admin.addProduct}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}