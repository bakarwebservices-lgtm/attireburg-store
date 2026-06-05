'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface Order {
  id: string
  orderNumber: string
  date: string
  status: string
  total: number
  items: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AccountOverview() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }

    const load = async () => {
      const session = getSession()
      if (!session?.token) { setLoading(false); return }

      try {
        // Real orders
        const ordersRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setRecentOrders(
            (data.orders || []).slice(0, 3).map((o: any) => ({
              id: o.id,
              orderNumber: `ATB-${o.id.slice(-6).toUpperCase()}`,
              date: o.createdAt,
              status: o.status,
              total: o.totalAmount,
              items: o.items?.length || 0,
            }))
          )
        }

        // Real wishlist count
        const wishlistRes = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (wishlistRes.ok) {
          const wData = await wishlistRes.json()
          setWishlistCount((wData.wishlist || []).length)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, router])

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  const totalSpent = recentOrders.reduce((s, o) => s + o.total, 0)

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            {t.dashboard.welcome}, {user.name}!
          </h2>
          <p className="text-gray-500 text-sm">
            {lang === 'de' ? 'Hier finden Sie eine Übersicht über Ihr Konto.' : 'Here is an overview of your account.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: lang === 'de' ? 'Bestellungen' : 'Orders', value: String(recentOrders.length), icon: '📦' },
            { label: lang === 'de' ? 'Wunschliste' : 'Wishlist', value: String(wishlistCount), icon: '❤️' },
            { label: lang === 'de' ? 'Gesamtausgaben' : 'Total spent', value: fmt(totalSpent), icon: '💳' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-lg shadow-sm p-5 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t.dashboard.recentOrders}</h3>
            <Link href="/account/orders" className="text-sm text-brand-800 hover:text-brand-700 font-medium">
              {lang === 'de' ? 'Alle anzeigen' : 'View all'}
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0 gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('de-DE')} · {order.items} {lang === 'de' ? 'Artikel' : 'items'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {t.dashboard.orderStatuses[order.status as keyof typeof t.dashboard.orderStatuses] || order.status}
                      </span>
                      <p className="font-semibold text-gray-900 text-sm">{fmt(order.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-3">{t.dashboard.noOrders}</p>
                <Link href="/products" className="inline-block bg-brand-800 hover:bg-brand-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm">
                  {lang === 'de' ? 'Jetzt einkaufen' : 'Shop now'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + Help */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{lang === 'de' ? 'Schnellzugriff' : 'Quick access'}</h3>
            <div className="space-y-3">
              {[
                { href: '/account/profile', icon: '👤', label: lang === 'de' ? 'Profil bearbeiten' : 'Edit profile' },
                { href: '/account/addresses', icon: '📍', label: lang === 'de' ? 'Adressen verwalten' : 'Manage addresses' },
                { href: '/account/wishlist', icon: '❤️', label: lang === 'de' ? 'Wunschliste' : 'Wishlist' },
                { href: '/account/orders', icon: '📦', label: lang === 'de' ? 'Alle Bestellungen' : 'All orders' },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-800 transition-colors">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{lang === 'de' ? 'Hilfe & Support' : 'Help & Support'}</h3>
            <div className="space-y-3">
              {[
                { href: '/contact', icon: '✉️', label: lang === 'de' ? 'Kontakt aufnehmen' : 'Contact us' },
                { href: '/faq', icon: '❓', label: lang === 'de' ? 'Häufige Fragen' : 'FAQs' },
                { href: '/returns', icon: '↩️', label: lang === 'de' ? 'Rückgabe & Umtausch' : 'Returns' },
                { href: '/shipping', icon: '🚚', label: lang === 'de' ? 'Versandinformationen' : 'Shipping info' },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-800 transition-colors">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
