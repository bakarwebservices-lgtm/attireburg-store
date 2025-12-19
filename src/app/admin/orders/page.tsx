'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  paymentMethod: string
  shippingAddress: string
  date: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  size?: string
  color?: string
}

export default function AdminOrders() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchOrders = async () => {
    try {
      // For admin, we need a different endpoint to get all orders
      // For now, we'll use mock data since we need to implement admin-specific order fetching
      setOrders([
        {
          id: '1',
          orderNumber: 'ATB-001240',
          customerName: 'Max Mustermann',
          customerEmail: 'max@example.com',
          total: 159.99,
          status: 'PENDING',
          paymentMethod: 'PayPal',
          shippingAddress: 'Musterstraße 123, 10115 Berlin',
          date: '2024-01-25T10:30:00Z',
          items: [
            { id: '1', name: 'Premium Wollpullover Classic', quantity: 1, price: 129.99, size: 'L', color: 'Grau' },
            { id: '2', name: 'Versandkosten', quantity: 1, price: 4.99 }
          ]
        }
      ])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }
    
    fetchOrders()
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
    alert(t.admin.orderUpdated)
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch = search === '' || 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase())
    
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
                {t.admin.orders}
              </h2>
              <p className="text-gray-600 mt-1">
                Verwalten Sie alle Kundenbestellungen
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {filteredOrders.length} von {orders.length} Bestellungen
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.search}
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bestellnummer, Kunde oder E-Mail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.status}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="all">Alle Bestellungen</option>
                <option value="PENDING">In Bearbeitung</option>
                <option value="PROCESSING">Wird verarbeitet</option>
                <option value="SHIPPED">Versandt</option>
                <option value="DELIVERED">Zugestellt</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {order.customerName} • {order.customerEmail}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.date)} • {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary-600 ${getStatusColor(order.status)}`}
                      >
                        <option value="PENDING">In Bearbeitung</option>
                        <option value="PROCESSING">Wird verarbeitet</option>
                        <option value="SHIPPED">Versandt</option>
                        <option value="DELIVERED">Zugestellt</option>
                        <option value="CANCELLED">Storniert</option>
                      </select>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {t.admin.orderItems}
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <span className="text-gray-900">{item.name}</span>
                              {item.size && (
                                <span className="text-gray-500 ml-2">Größe: {item.size}</span>
                              )}
                              {item.color && (
                                <span className="text-gray-500 ml-2">Farbe: {item.color}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">{item.quantity}x</span>
                              <span className="font-medium text-gray-900">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {t.admin.shippingAddress}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Details anzeigen
                      </Link>
                      {order.status === 'SHIPPED' && (
                        <button className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                          Tracking-Info
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                        Rechnung drucken
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items.length} {order.items.length === 1 ? 'Artikel' : 'Artikel'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Bestellungen gefunden
              </h3>
              <p className="text-gray-600">
                {search || filter !== 'all' 
                  ? 'Versuchen Sie, Ihre Filter zu ändern.'
                  : 'Es sind noch keine Bestellungen eingegangen.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}