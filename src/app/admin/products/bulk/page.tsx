'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  status: 'draft' | 'published' | 'private'
  featured: boolean
}

interface BulkAction {
  id: string
  label: string
  description: string
  icon: string
  action: (selectedProducts: string[], data?: any) => void
}

export default function BulkProductOperations() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    
    // Simulate loading products
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          name: 'Premium Wollpullover Classic',
          sku: 'ATB-PULL-001',
          price: 129.99,
          stock: 15,
          category: 'pullover',
          status: 'published',
          featured: true
        },
        {
          id: '2',
          name: 'Winterjacke Alpine Pro',
          sku: 'ATB-JACK-001',
          price: 249.99,
          stock: 8,
          category: 'jacken',
          status: 'published',
          featured: false
        },
        {
          id: '3',
          name: 'Hoodie Urban Comfort',
          sku: 'ATB-HOOD-001',
          price: 89.99,
          stock: 0,
          category: 'hoodies',
          status: 'draft',
          featured: false
        },
        {
          id: '4',
          name: 'Strickjacke Elegant',
          sku: 'ATB-CARD-001',
          price: 159.99,
          stock: 12,
          category: 'pullover',
          status: 'published',
          featured: true
        },
        {
          id: '5',
          name: 'Regenjacke Outdoor',
          sku: 'ATB-RAIN-001',
          price: 199.99,
          stock: 5,
          category: 'jacken',
          status: 'private',
          featured: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [user, router])

  const bulkActions: BulkAction[] = [
    {
      id: 'update-status',
      label: 'Status ändern',
      description: 'Status für ausgewählte Produkte ändern',
      icon: '📝',
      action: (ids, data) => {
        setProducts(prev => prev.map(p => 
          ids.includes(p.id) ? { ...p, status: data.status } : p
        ))
      }
    },
    {
      id: 'update-category',
      label: 'Kategorie ändern',
      description: 'Kategorie für ausgewählte Produkte ändern',
      icon: '🏷️',
      action: (ids, data) => {
        setProducts(prev => prev.map(p => 
          ids.includes(p.id) ? { ...p, category: data.category } : p
        ))
      }
    },
    {
      id: 'update-price',
      label: 'Preise anpassen',
      description: 'Preise prozentual oder absolut anpassen',
      icon: '💰',
      action: (ids, data) => {
        setProducts(prev => prev.map(p => {
          if (!ids.includes(p.id)) return p
          
          let newPrice = p.price
          if (data.type === 'percentage') {
            newPrice = p.price * (1 + data.value / 100)
          } else {
            newPrice = p.price + data.value
          }
          
          return { ...p, price: Math.max(0, newPrice) }
        }))
      }
    },
    {
      id: 'update-stock',
      label: 'Lagerbestand anpassen',
      description: 'Lagerbestand für ausgewählte Produkte anpassen',
      icon: '📦',
      action: (ids, data) => {
        setProducts(prev => prev.map(p => {
          if (!ids.includes(p.id)) return p
          
          let newStock = p.stock
          if (data.type === 'set') {
            newStock = data.value
          } else if (data.type === 'add') {
            newStock = p.stock + data.value
          } else if (data.type === 'subtract') {
            newStock = p.stock - data.value
          }
          
          return { ...p, stock: Math.max(0, newStock) }
        }))
      }
    },
    {
      id: 'toggle-featured',
      label: 'Ausgewählt umschalten',
      description: 'Featured-Status für ausgewählte Produkte umschalten',
      icon: '⭐',
      action: (ids) => {
        setProducts(prev => prev.map(p => 
          ids.includes(p.id) ? { ...p, featured: !p.featured } : p
        ))
      }
    },
    {
      id: 'duplicate',
      label: 'Duplizieren',
      description: 'Ausgewählte Produkte duplizieren',
      icon: '📋',
      action: (ids) => {
        const duplicates = products
          .filter(p => ids.includes(p.id))
          .map(p => ({
            ...p,
            id: `${p.id}-copy-${Date.now()}`,
            name: `${p.name} (Kopie)`,
            sku: `${p.sku}-COPY`,
            status: 'draft' as const
          }))
        
        setProducts(prev => [...prev, ...duplicates])
      }
    },
    {
      id: 'delete',
      label: 'Löschen',
      description: 'Ausgewählte Produkte löschen',
      icon: '🗑️',
      action: (ids) => {
        if (confirm(`Sind Sie sicher, dass Sie ${ids.length} Produkt(e) löschen möchten?`)) {
          setProducts(prev => prev.filter(p => !ids.includes(p.id)))
          setSelectedProducts([])
        }
      }
    }
  ]

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const executeAction = (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId)
    if (!action || selectedProducts.length === 0) return

    if (actionId === 'delete' || actionId === 'toggle-featured' || actionId === 'duplicate') {
      action.action(selectedProducts)
      setSelectedProducts([])
      setActiveAction(null)
    } else {
      setActiveAction(actionId)
    }
  }

  const applyActionWithData = () => {
    const action = bulkActions.find(a => a.id === activeAction)
    if (!action) return

    action.action(selectedProducts, actionData)
    setSelectedProducts([])
    setActiveAction(null)
    setActionData({})
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      private: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      published: 'Veröffentlicht',
      draft: 'Entwurf',
      private: 'Privat'
    }
    return labels[status as keyof typeof labels] || status
  }

  if (!user || !user.isAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Bulk-Operationen
            </h1>
            <p className="text-gray-600 mt-1">
              Mehrere Produkte gleichzeitig bearbeiten
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Zurück zu Produkten
          </button>
        </div>

        {/* Selection Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900">
                {selectedProducts.length} von {products.length} Produkten ausgewählt
              </span>
              {selectedProducts.length > 0 && (
                <button
                  onClick={() => setSelectedProducts([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Auswahl aufheben
                </button>
              )}
            </div>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedProducts.length === products.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verfügbare Aktionen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => executeAction(action.id)}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="text-2xl">{action.icon}</div>
                  <div>
                    <div className="font-medium text-gray-900">{action.label}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Configuration Modal */}
        {activeAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {bulkActions.find(a => a.id === activeAction)?.label}
              </h3>
              
              {activeAction === 'update-status' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neuer Status
                    </label>
                    <select
                      value={actionData.status || ''}
                      onChange={(e) => setActionData({ status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="">Status wählen</option>
                      <option value="published">Veröffentlicht</option>
                      <option value="draft">Entwurf</option>
                      <option value="private">Privat</option>
                    </select>
                  </div>
                </div>
              )}

              {activeAction === 'update-category' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neue Kategorie
                    </label>
                    <select
                      value={actionData.category || ''}
                      onChange={(e) => setActionData({ category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="">Kategorie wählen</option>
                      <option value="pullover">Pullover</option>
                      <option value="jacken">Jacken</option>
                      <option value="hoodies">Hoodies</option>
                      <option value="shirts">Shirts</option>
                    </select>
                  </div>
                </div>
              )}

              {activeAction === 'update-price' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anpassungstyp
                    </label>
                    <select
                      value={actionData.type || ''}
                      onChange={(e) => setActionData({ ...actionData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="">Typ wählen</option>
                      <option value="percentage">Prozentual</option>
                      <option value="absolute">Absolut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wert {actionData.type === 'percentage' ? '(%)' : '(€)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actionData.value || ''}
                      onChange={(e) => setActionData({ ...actionData, value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder={actionData.type === 'percentage' ? '10' : '5.00'}
                    />
                  </div>
                </div>
              )}

              {activeAction === 'update-stock' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anpassungstyp
                    </label>
                    <select
                      value={actionData.type || ''}
                      onChange={(e) => setActionData({ ...actionData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="">Typ wählen</option>
                      <option value="set">Setzen auf</option>
                      <option value="add">Hinzufügen</option>
                      <option value="subtract">Abziehen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl
                    </label>
                    <input
                      type="number"
                      value={actionData.value || ''}
                      onChange={(e) => setActionData({ ...actionData, value: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="10"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setActiveAction(null)
                    setActionData({})
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={applyActionWithData}
                  disabled={!actionData.status && !actionData.category && !actionData.type}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Anwenden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
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
                      Kategorie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                              {product.featured && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⭐ Ausgewählt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock > 10
                            ? 'bg-green-100 text-green-800'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} Stück
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {product.category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}