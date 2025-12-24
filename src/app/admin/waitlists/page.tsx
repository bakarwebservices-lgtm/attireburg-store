'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

interface WaitlistSubscription {
  id: string
  email: string
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  userId?: string
  userName?: string
  isActive: boolean
  createdAt: Date
  expectedRestockDate?: Date
}

interface WaitlistAnalytics {
  totalSubscriptions: number
  activeSubscriptions: number
  subscriptionsByProduct: Array<{
    productId: string
    productName: string
    count: number
  }>
}

export default function AdminWaitlistDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<WaitlistSubscription[]>([])
  const [analytics, setAnalytics] = useState<WaitlistAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterProduct, setFilterProduct] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }

    fetchWaitlistData()
  }, [user, router])

  const fetchWaitlistData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/waitlists')
      
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        setAnalytics(data.analytics || null)
      } else {
        setError('Fehler beim Laden der Wartelisten-Daten')
      }
    } catch (error) {
      console.error('Error fetching waitlist data:', error)
      setError('Fehler beim Laden der Wartelisten-Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (productId: string, variantId?: string) => {
    if (!confirm('Möchten Sie Benachrichtigungen für dieses Produkt senden?')) {
      return
    }

    try {
      const response = await fetch('/api/notifications/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          variantId,
          trigger: 'manual'
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.notificationsSent} Benachrichtigungen gesendet`)
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Senden der Benachrichtigungen')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert('Fehler beim Senden der Benachrichtigungen')
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions
    .filter(subscription => {
      if (filterProduct === 'all') return true
      return subscription.productId === filterProduct
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'product':
          return a.productName.localeCompare(b.productName)
        case 'email':
          return a.email.localeCompare(b.email)
        default:
          return 0
      }
    })

  const uniqueProducts = Array.from(
    new Set(subscriptions.map(s => s.productId))
  ).map(productId => {
    const subscription = subscriptions.find(s => s.productId === productId)
    return {
      id: productId,
      name: subscription?.productName || 'Unknown Product'
    }
  })

  if (!user || !user.isAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wartelisten verwalten</h1>
            <p className="text-gray-600 mt-1">
              Übersicht und Verwaltung aller Wartelisten-Abonnements
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchWaitlistData}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gesamt</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.totalSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aktiv</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Produkte</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.subscriptionsByProduct.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular Products */}
        {analytics && analytics.subscriptionsByProduct.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beliebteste Produkte</h3>
            <div className="space-y-3">
              {analytics.subscriptionsByProduct.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs font-semibold mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{product.productName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{product.count} Abonnements</span>
                    <button
                      onClick={() => handleSendNotification(product.productId)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Benachrichtigen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produkt</label>
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Alle Produkte</option>
                  {uniqueProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sortieren</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="date">Datum</option>
                  <option value="product">Produkt</option>
                  <option value="email">E-Mail</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Wird geladen...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchWaitlistData}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Wartelisten-Abonnements gefunden</h3>
              <p className="text-gray-600">
                {filterProduct === 'all' 
                  ? 'Es sind noch keine Wartelisten-Abonnements vorhanden.'
                  : 'Keine Abonnements für das ausgewählte Produkt gefunden.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subscription.email}</div>
                          {subscription.userName && (
                            <div className="text-sm text-gray-500">{subscription.userName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subscription.productName}</div>
                          {subscription.variantSku && (
                            <div className="text-sm text-gray-500">SKU: {subscription.variantSku}</div>
                          )}
                          {subscription.expectedRestockDate && (
                            <div className="text-xs text-blue-600 mt-1">
                              Erwartet: {formatDate(new Date(subscription.expectedRestockDate))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(new Date(subscription.createdAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSendNotification(subscription.productId, subscription.variantId)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Benachrichtigen
                        </button>
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