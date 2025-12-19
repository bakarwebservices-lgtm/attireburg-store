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
  items: number
}

interface BackorderSummary {
  totalBackorders: number
  pendingBackorders: number
  totalValue: number
}

interface WaitlistSummary {
  totalSubscriptions: number
  activeSubscriptions: number
}

export default function AccountOverview() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [backorderSummary, setBackorderSummary] = useState<BackorderSummary>({ totalBackorders: 0, pendingBackorders: 0, totalValue: 0 })
  const [waitlistSummary, setWaitlistSummary] = useState<WaitlistSummary>({ totalSubscriptions: 0, activeSubscriptions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load account data
    const loadAccountData = async () => {
      try {
        // Load recent orders
        setRecentOrders([
          {
            id: '1',
            orderNumber: 'ATB-001234',
            date: '2024-01-15',
            status: 'DELIVERED',
            total: 159.99,
            items: 2
          },
          {
            id: '2',
            orderNumber: 'ATB-001235',
            date: '2024-01-20',
            status: 'SHIPPED',
            total: 89.99,
            items: 1
          },
          {
            id: '3',
            orderNumber: 'ATB-001236',
            date: '2024-01-25',
            status: 'PROCESSING',
            total: 249.99,
            items: 3
          }
        ])

        // Load backorder summary
        if (user.id) {
          try {
            const backorderResponse = await fetch(`/api/backorders/status?userId=${user.id}`)
            if (backorderResponse.ok) {
              const backorderData = await backorderResponse.json()
              const backorders = backorderData.backorders || []
              const pendingBackorders = backorders.filter((b: any) => b.status === 'PENDING')
              const totalValue = backorders.reduce((sum: number, b: any) => sum + b.totalAmount, 0)
              
              setBackorderSummary({
                totalBackorders: backorders.length,
                pendingBackorders: pendingBackorders.length,
                totalValue
              })
            }
          } catch (error) {
            console.error('Error loading backorder summary:', error)
          }
        }

        // Load waitlist summary
        if (user.email) {
          try {
            const waitlistResponse = await fetch(`/api/waitlist/subscriptions?email=${encodeURIComponent(user.email)}`)
            if (waitlistResponse.ok) {
              const waitlistData = await waitlistResponse.json()
              const subscriptions = waitlistData.subscriptions || []
              const activeSubscriptions = subscriptions.filter((s: any) => s.isActive !== false)
              
              setWaitlistSummary({
                totalSubscriptions: subscriptions.length,
                activeSubscriptions: activeSubscriptions.length
              })
            }
          } catch (error) {
            console.error('Error loading waitlist summary:', error)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadAccountData()
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

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t.dashboard.welcome}, {user.name}!
          </h2>
          <p className="text-gray-600">
            Hier finden Sie eine Übersicht über Ihr Konto und Ihre letzten Aktivitäten.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bestellungen</p>
                <p className="text-2xl font-semibold text-gray-900">{recentOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vorbestellungen</p>
                <p className="text-2xl font-semibold text-gray-900">{backorderSummary.totalBackorders}</p>
                {backorderSummary.pendingBackorders > 0 && (
                  <p className="text-xs text-orange-600">{backorderSummary.pendingBackorders} ausstehend</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wartelisten</p>
                <p className="text-2xl font-semibold text-gray-900">{waitlistSummary.totalSubscriptions}</p>
                {waitlistSummary.activeSubscriptions > 0 && (
                  <p className="text-xs text-blue-600">{waitlistSummary.activeSubscriptions} aktiv</p>
                )}
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
                <p className="text-sm font-medium text-gray-600">Gesamtausgaben</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPrice(recentOrders.reduce((sum, order) => sum + order.total, 0) + backorderSummary.totalValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wunschliste</p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t.dashboard.recentOrders}
              </h3>
              <Link
                href="/account/orders"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Alle anzeigen
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('de-DE')} • {order.items} Artikel
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {t.dashboard.orderStatuses[order.status as keyof typeof t.dashboard.orderStatuses]}
                      </span>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        {t.dashboard.viewOrder}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600">{t.dashboard.noOrders}</p>
                <Link
                  href="/products"
                  className="inline-block mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Jetzt einkaufen
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Backorder & Waitlist Summary */}
        {(backorderSummary.totalBackorders > 0 || waitlistSummary.totalSubscriptions > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backorder Summary */}
            {backorderSummary.totalBackorders > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Aktuelle Vorbestellungen
                    </h3>
                    <Link
                      href="/account/backorders"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Alle anzeigen
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{backorderSummary.totalBackorders}</p>
                      <p className="text-sm text-gray-600">Vorbestellungen insgesamt</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatPrice(backorderSummary.totalValue)}</p>
                      <p className="text-sm text-gray-600">Gesamtwert</p>
                    </div>
                  </div>
                  {backorderSummary.pendingBackorders > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-orange-800">
                            {backorderSummary.pendingBackorders} Vorbestellung{backorderSummary.pendingBackorders !== 1 ? 'en' : ''} ausstehend
                          </p>
                          <p className="text-xs text-orange-600">
                            Sie erhalten eine Benachrichtigung, sobald Ihre Artikel verfügbar sind
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waitlist Summary */}
            {waitlistSummary.totalSubscriptions > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Wartelisten-Abonnements
                    </h3>
                    <Link
                      href="/account/waitlist"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Alle anzeigen
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{waitlistSummary.totalSubscriptions}</p>
                      <p className="text-sm text-gray-600">Abonnements insgesamt</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{waitlistSummary.activeSubscriptions}</p>
                      <p className="text-sm text-gray-600">Aktiv</p>
                    </div>
                  </div>
                  {waitlistSummary.activeSubscriptions > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {waitlistSummary.activeSubscriptions} aktive Benachrichtigung{waitlistSummary.activeSubscriptions !== 1 ? 'en' : ''}
                          </p>
                          <p className="text-xs text-blue-600">
                            Sie werden benachrichtigt, sobald Produkte wieder verfügbar sind
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schnellzugriff
            </h3>
            <div className="space-y-3">
              <Link
                href="/account/profile"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profil bearbeiten</span>
              </Link>
              <Link
                href="/account/addresses"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Adressen verwalten</span>
              </Link>
              <Link
                href="/account/wishlist"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Wunschliste anzeigen</span>
              </Link>
              <Link
                href="/account/backorders"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Vorbestellungen verwalten</span>
              </Link>
              <Link
                href="/account/waitlist"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z" />
                </svg>
                <span>Wartelisten anzeigen</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hilfe & Support
            </h3>
            <div className="space-y-3">
              <Link
                href="/contact"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Kontakt aufnehmen</span>
              </Link>
              <Link
                href="/faq"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Häufige Fragen</span>
              </Link>
              <Link
                href="/returns"
                className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Rückgabe & Umtausch</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}