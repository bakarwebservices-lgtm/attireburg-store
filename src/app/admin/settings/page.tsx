'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface Settings {
  store: {
    name: string
    description: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  shipping: {
    freeShippingThreshold: number
    standardShippingCost: number
    expressShippingCost: number
  }
  tax: {
    taxRate: number
    taxIncluded: boolean
  }
  notifications: {
    orderNotifications: boolean
    lowStockAlerts: boolean
    customerRegistrations: boolean
    emailReports: boolean
  }
}

export default function AdminSettings() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  const [settings, setSettings] = useState<Settings>({
    store: {
      name: 'Attireburg',
      description: 'Premium deutsche Kleidung - Pullover und Jacken in höchster Qualität',
      email: 'info@attireburg.de',
      phone: '+49 30 12345678',
      address: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland'
    },
    shipping: {
      freeShippingThreshold: 75,
      standardShippingCost: 4.99,
      expressShippingCost: 9.99
    },
    tax: {
      taxRate: 19,
      taxIncluded: true
    },
    notifications: {
      orderNotifications: true,
      lowStockAlerts: true,
      customerRegistrations: false,
      emailReports: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.isAdmin) {
      router.push('/account')
      return
    }
  }, [user, router])

  const handleSave = async () => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const updateSettings = (section: keyof Settings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

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
                Einstellungen
              </h2>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Ihre Shop-Einstellungen und Konfiguration
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : saved
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {loading ? 'Speichern...' : saved ? 'Gespeichert!' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Shop-Informationen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop-Name
              </label>
              <input
                type="text"
                value={settings.store.name}
                onChange={(e) => updateSettings('store', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={settings.store.email}
                onChange={(e) => updateSettings('store', 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={settings.store.phone}
                onChange={(e) => updateSettings('store', 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={settings.store.address}
                onChange={(e) => updateSettings('store', 'address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stadt
              </label>
              <input
                type="text"
                value={settings.store.city}
                onChange={(e) => updateSettings('store', 'city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PLZ
              </label>
              <input
                type="text"
                value={settings.store.postalCode}
                onChange={(e) => updateSettings('store', 'postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={settings.store.description}
                onChange={(e) => updateSettings('store', 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Versandeinstellungen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kostenloser Versand ab (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.shipping.freeShippingThreshold}
                onChange={(e) => updateSettings('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Versand (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.shipping.standardShippingCost}
                onChange={(e) => updateSettings('shipping', 'standardShippingCost', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Express Versand (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.shipping.expressShippingCost}
                onChange={(e) => updateSettings('shipping', 'expressShippingCost', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Steuereinstellungen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Steuersatz (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.tax.taxRate}
                onChange={(e) => updateSettings('tax', 'taxRate', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="taxIncluded"
                checked={settings.tax.taxIncluded}
                onChange={(e) => updateSettings('tax', 'taxIncluded', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="taxIncluded" className="ml-2 text-sm font-medium text-gray-700">
                Preise inkl. Steuer anzeigen
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Benachrichtigungen
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="orderNotifications"
                checked={settings.notifications.orderNotifications}
                onChange={(e) => updateSettings('notifications', 'orderNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="orderNotifications" className="ml-3">
                <span className="text-sm font-medium text-gray-700">Bestellbenachrichtigungen</span>
                <p className="text-sm text-gray-500">E-Mail bei neuen Bestellungen erhalten</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lowStockAlerts"
                checked={settings.notifications.lowStockAlerts}
                onChange={(e) => updateSettings('notifications', 'lowStockAlerts', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="lowStockAlerts" className="ml-3">
                <span className="text-sm font-medium text-gray-700">Lagerbestand-Warnungen</span>
                <p className="text-sm text-gray-500">Benachrichtigung bei niedrigem Lagerbestand</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="customerRegistrations"
                checked={settings.notifications.customerRegistrations}
                onChange={(e) => updateSettings('notifications', 'customerRegistrations', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="customerRegistrations" className="ml-3">
                <span className="text-sm font-medium text-gray-700">Kundenregistrierungen</span>
                <p className="text-sm text-gray-500">E-Mail bei neuen Kundenregistrierungen</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailReports"
                checked={settings.notifications.emailReports}
                onChange={(e) => updateSettings('notifications', 'emailReports', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="emailReports" className="ml-3">
                <span className="text-sm font-medium text-gray-700">Wöchentliche Berichte</span>
                <p className="text-sm text-gray-500">Wöchentliche Verkaufsberichte per E-Mail</p>
              </label>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System-Informationen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700">Version</p>
              <p className="text-sm text-gray-600">Attireburg v1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Letztes Update</p>
              <p className="text-sm text-gray-600">17. Dezember 2024</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Datenbank</p>
              <p className="text-sm text-gray-600">PostgreSQL</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Server Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}