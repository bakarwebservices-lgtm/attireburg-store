'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

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

interface Order {
  id: string
  orderNumber: string
  date: string
  status: string
  total: number
  items: OrderItem[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function UserOrders() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchOrders = useCallback(async () => {
    const session = getSession()
    if (!session?.token) return
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const formatted = (data.orders || []).map((o: any) => ({
          id: o.id,
          orderNumber: `ATB-${o.id.slice(-6).toUpperCase()}`,
          date: o.createdAt,
          status: o.status,
          total: o.totalAmount,
          items: (o.items || []).map((i: any) => ({
            id: i.id,
            name: i.product?.name || 'Produkt',
            nameEn: i.product?.nameEn || 'Product',
            quantity: i.quantity,
            price: i.price,
            size: i.size,
            color: i.color,
            image: i.product?.images?.[0] || '',
          })),
        }))
        setOrders(formatted)
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchOrders()
  }, [user, router, fetchOrders])

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{t.dashboard.orders}</h2>
              <p className="text-gray-600 mt-1">{lang === 'de' ? 'Alle Ihre Bestellungen auf einen Blick' : 'All your orders at a glance'}</p>
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 text-sm">
              <option value="all">{lang === 'de' ? 'Alle Bestellungen' : 'All orders'}</option>
              <option value="PENDING">{t.dashboard.orderStatuses.PENDING}</option>
              <option value="PROCESSING">{t.dashboard.orderStatuses.PROCESSING}</option>
              <option value="SHIPPED">{t.dashboard.orderStatuses.SHIPPED}</option>
              <option value="DELIVERED">{t.dashboard.orderStatuses.DELIVERED}</option>
              <option value="CANCELLED">{t.dashboard.orderStatuses.CANCELLED}</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse h-40" />
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.dashboard.noOrders}</h3>
              <Link href="/products" className="inline-block mt-2 bg-brand-800 hover:bg-brand-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
                {lang === 'de' ? 'Jetzt einkaufen' : 'Shop now'}
              </Link>
            </div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {t.dashboard.orderStatuses[order.status as keyof typeof t.dashboard.orderStatuses] || order.status}
                      </span>
                      <p className="font-bold text-gray-900">{fmt(order.total)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lang === 'de' ? item.name : item.nameEn}</p>
                        <p className="text-xs text-gray-500">
                          {item.size && `${lang === 'de' ? 'Größe' : 'Size'}: ${item.size}`}
                          {item.color && ` · ${item.color}`}
                          {` · ×${item.quantity}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 shrink-0">{fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
