'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface User {
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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }
    
    // Simulate loading users
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          name: 'Max Mustermann',
          email: 'max@example.com',
          firstName: 'Max',
          lastName: 'Mustermann',
          phone: '+49 123 456789',
          city: 'Berlin',
          country: 'Deutschland',
          isAdmin: false,
          isActive: true,
          totalOrders: 5,
          totalSpent: 789.95,
          lastLogin: '2024-01-25T10:30:00Z',
          createdAt: '2023-12-01T09:00:00Z'
        },
        {
          id: '2',
          name: 'Anna Schmidt',
          email: 'anna@example.com',
          firstName: 'Anna',
          lastName: 'Schmidt',
          phone: '+49 987 654321',
          city: 'Hamburg',
          country: 'Deutschland',
          isAdmin: false,
          isActive: true,
          totalOrders: 3,
          totalSpent: 459.97,
          lastLogin: '2024-01-24T15:20:00Z',
          createdAt: '2023-11-15T14:30:00Z'
        },
        {
          id: '3',
          name: 'Thomas Weber',
          email: 'thomas@example.com',
          firstName: 'Thomas',
          lastName: 'Weber',
          city: 'München',
          country: 'Deutschland',
          isAdmin: false,
          isActive: true,
          totalOrders: 8,
          totalSpent: 1249.92,
          lastLogin: '2024-01-23T18:45:00Z',
          createdAt: '2023-10-20T11:15:00Z'
        },
        {
          id: '4',
          name: 'Lisa Müller',
          email: 'lisa@example.com',
          firstName: 'Lisa',
          lastName: 'Müller',
          phone: '+49 555 123456',
          city: 'Köln',
          country: 'Deutschland',
          isAdmin: false,
          isActive: true,
          totalOrders: 2,
          totalSpent: 199.98,
          lastLogin: '2024-01-22T12:10:00Z',
          createdAt: '2024-01-10T16:20:00Z'
        },
        {
          id: '5',
          name: 'Michael Klein',
          email: 'michael@example.com',
          firstName: 'Michael',
          lastName: 'Klein',
          city: 'Frankfurt',
          country: 'Deutschland',
          isAdmin: false,
          isActive: false,
          totalOrders: 1,
          totalSpent: 79.99,
          lastLogin: '2024-01-15T09:30:00Z',
          createdAt: '2023-12-28T13:45:00Z'
        },
        {
          id: '6',
          name: 'Admin User',
          email: 'admin@attireburg.de',
          firstName: 'Admin',
          lastName: 'User',
          country: 'Deutschland',
          isAdmin: true,
          isActive: true,
          totalOrders: 0,
          totalSpent: 0,
          lastLogin: '2024-01-25T08:00:00Z',
          createdAt: '2023-01-01T00:00:00Z'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ))
  }

  const handleToggleAdmin = (userId: string) => {
    if (confirm('Sind Sie sicher, dass Sie die Admin-Berechtigung ändern möchten?')) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u
      ))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && user.isActive) ||
      (filter === 'inactive' && !user.isActive) ||
      (filter === 'admin' && user.isAdmin) ||
      (filter === 'customers' && !user.isAdmin)
    
    const matchesSearch = search === '' || 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.city && user.city.toLowerCase().includes(search.toLowerCase()))
    
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
                {t.admin.users}
              </h2>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Ihre Kunden und Benutzer
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {filteredUsers.length} von {users.length} Benutzern
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiv</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.isAdmin).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kunden</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => !u.isAdmin).length}
                </p>
              </div>
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
                placeholder="Name, E-Mail oder Stadt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.filter}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="all">Alle Benutzer</option>
                <option value="customers">Nur Kunden</option>
                <option value="admin">Nur Admins</option>
                <option value="active">Aktive Benutzer</option>
                <option value="inactive">Inaktive Benutzer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Benutzer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bestellungen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letzter Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {user.isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                Seit {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.phone && (
                            <div>{user.phone}</div>
                          )}
                          {user.city && (
                            <div className="text-gray-500">{user.city}, {user.country}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{user.totalOrders} Bestellungen</div>
                          <div className="text-gray-500">{formatPrice(user.totalSpent)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Nie'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Aktiv' : 'Inaktiv'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAdmin(user.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            {user.isAdmin ? 'Admin entfernen' : 'Admin machen'}
                          </button>
                          <button className="text-primary-600 hover:text-primary-900">
                            Bearbeiten
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Keine Benutzer gefunden
                  </h3>
                  <p className="text-gray-600">
                    Versuchen Sie, Ihre Filter zu ändern.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}