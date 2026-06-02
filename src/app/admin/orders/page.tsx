'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  size?: string
  color?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  shippingAddress: string
  date: string
  items: OrderItem[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
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

  const fetchOrders = useCallback(async () => {
    const session = getSession()
    if (!session?.token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    fetchOrders()
  }, [user, router, fetchOrders])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const session = getSession()
    if (!session?.token) return
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        alert(t.admin.orderUpdated)
      }
    } catch (e) {
      console.error('Failed to update order:', e)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (s: string) => new Date(s).toLocaleString('de-DE')

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{t.admin.orders}</h2>
              <p className="text-gray-600 mt-1">Verwalten Sie alle Kundenbestellungen</p>
            </div>
            <div className="text-sm text-gray-600">{orders.length} Bestellungen</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.common.search}</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Bestellnummer, Kunde oder E-Mail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.common.status}</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent">
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

        {/* Orders */}
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Bestellungen gefunden</h3>
              <p className="text-gray-600">{search || filter !== 'all' ? 'Versuchen Sie, Ihre Filter zu ändern.' : 'Es sind noch keine Bestellungen eingegangen.'}</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.customerName} · {order.customerEmail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.date)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-brand-800 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        <option value="PENDING">In Bearbeitung</option>
                        <option value="PROCESSING">Wird verarbeitet</option>
                        <option value="SHIPPED">Versandt</option>
                        <option value="DELIVERED">Zugestellt</option>
                        <option value="CANCELLED">Storniert</option>
                      </select>
                      <span className="text-lg font-bold text-gray-900">{fmt(order.total)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">{t.admin.orderItems}</p>
                      <div className="space-y-1.5">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.name}
                              {item.size && <span className="text-gray-400 ml-1">({item.size})</span>}
                              {item.color && <span className="text-gray-400 ml-1">{item.color}</span>}
                              <span className="text-gray-500 ml-1">×{item.quantity}</span>
                            </span>
                            <span className="font-medium text-gray-900">{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">{t.admin.shippingAddress}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
