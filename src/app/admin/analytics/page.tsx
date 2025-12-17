'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface AnalyticsData {
  revenue: {
    today: number
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  orders: {
    today: number
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  customers: {
    new: number
    returning: number
    total: number
  }
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesByCategory: Array<{
    category: string
    sales: number
    revenue: number
  }>
}

export default function AdminAnalytics() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('thisMonth')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }
    
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalytics({
        revenue: {
          today: 1250.50,
          thisWeek: 8750.25,
          thisMonth: 35420.80,
          lastMonth: 28950.60
        },
        orders: {
          today: 12,
          thisWeek: 85,
          thisMonth: 342,
          lastMonth: 289
        },
        customers: {
          new: 45,
          returning: 156,
          total: 201
        },
        topProducts: [
          { id: '1', name: 'Premium Wollpullover', sales: 45, revenue: 4455.00 },
          { id: '2', name: 'Klassische Strickjacke', sales: 38, revenue: 4560.00 },
          { id: '3', name: 'Winterjacke Premium', sales: 32, revenue: 6400.00 },
          { id: '4', name: 'Cashmere Pullover', sales: 28, revenue: 5600.00 },
          { id: '5', name: 'Herbstjacke', sales: 25, revenue: 2750.00 }
        ],
        salesByCategory: [
          { category: 'Pullover', sales: 156, revenue: 15600.00 },
          { category: 'Jacken', sales: 98, revenue: 14700.00 },
          { category: 'Strickjacken', sales: 88, revenue: 10560.00 }
        ]
      })
      setLoading(false)
    }, 1000)
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  if (!user || !user.isAdmin || !analytics) {
    return null
  }

  const revenueGrowth = calculateGrowth(analytics.revenue.thisMonth, analytics.revenue.lastMonth)
  const ordersGrowth = calculateGrowth(analytics.orders.thisMonth, analytics.orders.lastMonth)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Analytics & Berichte
              </h2>
              <p className="text-gray-600 mt-1">
                Detaillierte Einblicke in Ihre Geschäftsleistung
              </p>
            </div>
            <div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="today">Heute</option>
                <option value="thisWeek">Diese Woche</option>
                <option value="thisMonth">Dieser Monat</option>
                <option value="lastMonth">Letzter Monat</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Revenue & Orders Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Umsatz (Monat)</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatPrice(analytics.revenue.thisMonth)}
                    </p>
                    <p className={`text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs. letzter Monat
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bestellungen (Monat)</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.orders.thisMonth}
                    </p>
                    <p className={`text-sm ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ordersGrowth >= 0 ? '+' : ''}{ordersGrowth.toFixed(1)}% vs. letzter Monat
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Neue Kunden</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.customers.new}
                    </p>
                    <p className="text-sm text-gray-600">
                      {analytics.customers.returning} wiederkehrend
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ø Bestellwert</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatPrice(analytics.revenue.thisMonth / analytics.orders.thisMonth)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pro Bestellung
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Produkte
                </h3>
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-primary-600 font-semibold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.sales} verkauft
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales by Category */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Verkäufe nach Kategorie
                </h3>
                <div className="space-y-4">
                  {analytics.salesByCategory.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatPrice(category.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ 
                            width: `${(category.revenue / Math.max(...analytics.salesByCategory.map(c => c.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{category.sales} Verkäufe</span>
                        <span>
                          {((category.revenue / analytics.salesByCategory.reduce((sum, c) => sum + c.revenue, 0)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Letzte Aktivitäten
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Neue Bestellung #1234 von Max Mustermann - {formatPrice(159.99)}
                  </span>
                  <span className="text-xs text-gray-400">vor 5 Min</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Neuer Kunde registriert: Anna Schmidt
                  </span>
                  <span className="text-xs text-gray-400">vor 12 Min</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Bestellung #1233 wurde versendet
                  </span>
                  <span className="text-xs text-gray-400">vor 25 Min</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Produkt "Premium Wollpullover" wurde aktualisiert
                  </span>
                  <span className="text-xs text-gray-400">vor 1 Std</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}