'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalUsers: number
  topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string; date: string }>
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminAnalytics() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    loadAnalytics()
  }, [user, router])

  const loadAnalytics = async () => {
    const session = getSession()
    if (!session?.token) return
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error('Analytics load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  const avgOrder = data && data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900">{t.adminExtended.analytics.title}</h2>
          <p className="text-gray-600 mt-1">{t.adminExtended.analytics.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t.admin.totalRevenue, value: fmt(data.totalRevenue) },
                { label: t.admin.totalOrders, value: String(data.totalOrders) },
                { label: lang === 'de' ? 'Ø Bestellwert' : 'Avg. Order Value', value: fmt(avgOrder) },
                { label: t.admin.totalUsers, value: String(data.totalUsers) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.admin.topProducts}</h3>
                {data.topProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">{lang === 'de' ? 'Noch keine Verkaufsdaten' : 'No sales data yet'}</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 text-xs font-bold">{i + 1}</div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.sales} {lang === 'de' ? 'verkauft' : 'sold'}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{fmt(p.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.admin.recentOrders}</h3>
                {data.recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm">{lang === 'de' ? 'Noch keine Bestellungen' : 'No orders yet'}</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{order.customerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                            {t.dashboard.orderStatuses[order.status as keyof typeof t.dashboard.orderStatuses] || order.status}
                          </span>
                          <p className="text-sm font-semibold">{fmt(order.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            {lang === 'de' ? 'Fehler beim Laden der Statistiken.' : 'Failed to load analytics.'}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
