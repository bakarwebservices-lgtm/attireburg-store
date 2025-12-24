'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

interface BackorderItem {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  quantity: number
  size: string
  color?: string
  price: number
}

interface Backorder {
  id: string
  userId: string
  userEmail: string
  userName: string
  orderType: string
  status: string
  totalAmount: number
  currency: string
  expectedFulfillmentDate?: Date
  backorderPriority: number
  createdAt: Date
  items: BackorderItem[]
}

export default function AdminBackorderDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [backorders, setBackorders] = useState<Backorder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBackorders, setSelectedBackorders] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }

    fetchBackorders()
  }, [user, router])

  const fetchBackorders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backorders')
      
      if (response.ok) {
        const data = await response.json()
        setBackorders(data.backorders || [])
      } else {
        setError('Fehler beim Laden der Vorbestellungen')
      }
    } catch (error) {
      console.error('Error fetching backorders:', error)
      setError('Fehler beim Laden der Vorbestellungen')
    } finally {
      setLoading(false)
    }
  }

  const handleFulfillBackorder = async (backorderId: string) => {
    if (!confirm('Möchten Sie diese Vorbestellung als erfüllt markieren?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/backorders/fulfill', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backorderId,
          fulfillmentDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        await fetchBackorders()
        alert('Vorbestellung erfolgreich erfüllt')
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Erfüllen der Vorbestellung')
      }
    } catch (error) {
      console.error('Error fulfilling backorder:', error)
      alert('Fehler beim Erfüllen der Vorbestellung')
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend'
      case 'PROCESSING':
        return 'In Bearbeitung'
      case 'SHIPPED':
        return 'Versendet'
      case 'DELIVERED':
        return 'Zugestellt'
      case 'CANCELLED':
        return 'Storniert'
      default:
        return status
    }
  }

  // Filter and sort backorders
  const filteredBackorders = backorders
    .filter(backorder => {
      if (filterStatus === 'all') return true
      return backorder.status === filterStatus.toUpperCase()
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.backorderPriority - b.backorderPriority
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'amount':
          return b.totalAmount - a.totalAmount
        case 'customer':
          return a.userName.localeCompare(b.userName)
        default:
          return 0
      }
    })

  const stats = {
    total: backorders.length,
    pending: backorders.filter(b => b.status === 'PENDING').length,
    processing: backorders.filter(b => b.status === 'PROCESSING').length,
    totalValue: backorders.reduce((sum, b) => sum + b.totalAmount, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">Vorbestellungen verwalten</h1>
            <p className="text-gray-600 mt-1">
              Übersicht und Verwaltung aller Kundenvorbestellungen
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchBackorders}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ausstehend</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamtwert</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats.totalValue, 'EUR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Alle Status</option>
                  <option value="pending">Ausstehend</option>
                  <option value="processing">In Bearbeitung</option>
                  <option value="shipped">Versendet</option>
                  <option value="cancelled">Storniert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sortieren</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="priority">Priorität</option>
                  <option value="date">Datum</option>
                  <option value="amount">Betrag</option>
                  <option value="customer">Kunde</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Backorders Table */}
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
                onClick={fetchBackorders}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          ) : filteredBackorders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Vorbestellungen gefunden</h3>
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'Es sind noch keine Vorbestellungen vorhanden.'
                  : `Keine Vorbestellungen mit Status "${getStatusText(filterStatus.toUpperCase())}" gefunden.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bestellung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Betrag
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
                  {filteredBackorders.map((backorder) => (
                    <tr key={backorder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          #{backorder.backorderPriority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{backorder.userName}</div>
                          <div className="text-sm text-gray-500">{backorder.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{backorder.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {backorder.items.length} Artikel
                          </div>
                          {backorder.expectedFulfillmentDate && (
                            <div className="text-xs text-blue-600 mt-1">
                              Erwartet: {formatDate(new Date(backorder.expectedFulfillmentDate))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(backorder.status)}`}>
                          {getStatusText(backorder.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(backorder.totalAmount, backorder.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(new Date(backorder.createdAt))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {backorder.status === 'PENDING' && (
                            <button
                              onClick={() => handleFulfillBackorder(backorder.id)}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              Erfüllen
                            </button>
                          )}
                          <Link
                            href={`/admin/backorders/${backorder.id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Details
                          </Link>
                        </div>
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