'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface UserRow {
  id: string
  name: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  city?: string
  country: string
  isAdmin: boolean
  isActive: boolean
  totalOrders: number
  totalSpent: number
  lastLogin?: string
  createdAt: string
}

export default function AdminUsers() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    const session = getSession()
    if (!session?.token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    fetchUsers()
  }, [user, router, fetchUsers])

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!confirm('Admin-Berechtigung ändern?')) return
    const session = getSession()
    if (!session?.token) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId, isAdmin }),
      })
      if (res.ok) setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin } : u))
    } catch (e) { console.error(e) }
  }

  const toggleActive = async (userId: string, isActive: boolean) => {
    const session = getSession()
    if (!session?.token) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId, isActive }),
      })
      if (res.ok) setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u))
    } catch (e) { console.error(e) }
  }

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('de-DE')

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{t.admin.users}</h2>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Kunden und Benutzer</p>
            </div>
            <div className="text-sm text-gray-600">{users.length} Benutzer</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Gesamt', value: users.length, color: 'blue' },
            { label: 'Aktiv', value: users.filter(u => u.isActive).length, color: 'green' },
            { label: 'Admins', value: users.filter(u => u.isAdmin).length, color: 'purple' },
            { label: 'Kunden', value: users.filter(u => !u.isAdmin).length, color: 'yellow' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-5">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.common.search}</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, E-Mail oder Stadt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.common.filter}</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent">
                <option value="all">Alle Benutzer</option>
                <option value="customers">Nur Kunden</option>
                <option value="admin">Nur Admins</option>
                <option value="active">Aktive Benutzer</option>
                <option value="inactive">Inaktive Benutzer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 py-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Benutzer', 'Kontakt', 'Bestellungen', 'Letzter Login', 'Status', t.common.actions].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-brand-800 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                            <div className="flex gap-1 mt-0.5">
                              {u.isAdmin && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Admin</span>}
                              <span className="text-xs text-gray-400">Seit {fmtDate(u.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {u.phone && <div>{u.phone}</div>}
                        {u.city && <div className="text-gray-400">{u.city}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{u.totalOrders} Bestell.</div>
                        <div className="text-gray-500">{fmt(u.totalSpent)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.lastLogin ? fmtDate(u.lastLogin) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => toggleActive(u.id, !u.isActive)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.isActive ? 'Aktiv' : 'Inaktiv'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                            className="text-purple-600 hover:text-purple-800 text-left">
                            {u.isAdmin ? 'Admin entfernen' : 'Admin machen'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">Keine Benutzer gefunden.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
