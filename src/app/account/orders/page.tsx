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
  date: string
  status: string
  total: number
  items: OrderItem[]
}

interface OrderItem {
  id: string
  name: string
  nameEn: string
  quantity: number
  price: number
  size?: string
  color?: string
  image?: string
}

export default function UserOrders() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    // Simulate loading orders
    setTimeout(() => {
      setOrders([
        {
          id: '1',
          orderNumber: 'ATB-001234',
          date: '2024-01-15',
          status: 'DELIVERED',
          total: 159.99,
          items: [
            {
              id: '1',
              name: 'Premium Wollpullover Classic',
              nameEn: 'Premium Wool Sweater Classic',
              quantity: 1,
              price: 129.99,
              size: 'L',
              color: 'Grau',
              image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop'
            },
            {
              id: '2',
              name: 'Langarmshirt Essential',
              nameEn: 'Long Sleeve Shirt Essential',
              quantity: 1,
              price: 49.99,
              size: 'M',
              color: 'Schwarz'
            }
          ]
        },
        {
          id: '2',
          orderNumber: 'ATB-001235',
          date: '2024-01-20',
          status: 'SHIPPED',
          total: 89.99,
          items: [
            {
              id: '3',
              name: 'Hoodie Urban Comfort',
              nameEn: 'Hoodie Urban Comfort',
              quantity: 1,
              price: 89.99,
              size: 'L',
              color: 'Grau'
            }
          ]
        },
        {
          id: '3',
          orderNumber: 'ATB-001236',
          date: '2024-01-25',
          status: 'PROCESSING',
          total: 249.99,
          items: [
            {
              id: '4',
              name: 'Winterjacke Alpine Pro',
              nameEn: 'Winter Jacket Alpine Pro',
              quantity: 1,
              price: 249.99,
              size: 'XL',
              color: 'Schwarz'
            }
          ]
        },
        {
          id: '4',
          orderNumber: 'ATB-001237',
          date: '2024-01-10',
          status: 'CANCELLED',
          total: 79.99,
          items: [
            {
              id: '5',
              name: 'Fleecejacke Outdoor',
              nameEn: 'Fleece Jacket Outdoor',
              quantity: 1,
              price: 79.99,
              size: 'M',
              color: 'Blau'
            }
          ]
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

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
                {t.dashboard.orders}
              </h2>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Ihre Bestellungen und verfolgen Sie den Status
              </p>
            </div>
            
            {/* Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
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
                            Bestellt am {new Date(order.date).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {t.dashboard.orderStatuses[order.status as keyof typeof t.dashboard.orderStatuses]}
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={lang === 'de' ? item.name : item.nameEn}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">Kein Bild</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {lang === 'de' ? item.name : item.nameEn}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {item.size && <span>Größe: {item.size}</span>}
                            {item.color && <span className="ml-4">Farbe: {item.color}</span>}
                            <span className="ml-4">Anzahl: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Details anzeigen
                      </Link>
                      {order.status === 'DELIVERED' && (
                        <button className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                          Erneut bestellen
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                          Sendung verfolgen
                        </button>
                      )}
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
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Sie haben noch keine Bestellungen aufgegeben.'
                  : 'Keine Bestellungen mit diesem Status gefunden.'
                }
              </p>
              <Link
                href="/products"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Jetzt einkaufen
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}