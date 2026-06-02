'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface SiteSettings {
  storeName: string
  storeDescription: string
  storeDescriptionEn: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  storeCity: string
  storePostalCode: string
  heroTitleDe: string
  heroTitleEn: string
  heroSubtitleDe: string
  heroSubtitleEn: string
  logoUrl: string
  freeShippingThreshold: number
  standardShippingCost: number
  taxRate: number
  orderNotifications: boolean
  lowStockAlerts: boolean
}

const DEFAULTS: SiteSettings = {
  storeName: 'Attireburg',
  storeDescription: 'Premium deutsche Kleidung für höchste Ansprüche.',
  storeDescriptionEn: 'Premium German clothing for the highest standards.',
  storeEmail: 'info@attireburg.de',
  storePhone: '+49 30 12345678',
  storeAddress: 'Musterstraße 123',
  storeCity: 'Berlin',
  storePostalCode: '10115',
  heroTitleDe: 'Premium Deutsche Kleidung',
  heroTitleEn: 'Premium German Clothing',
  heroSubtitleDe: 'Neue Kollektion 2026',
  heroSubtitleEn: 'New Collection 2026',
  logoUrl: '/logo.png',
  freeShippingThreshold: 50,
  standardShippingCost: 4.99,
  taxRate: 19,
  orderNotifications: true,
  lowStockAlerts: true,
}

export default function AdminSettings() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    loadSettings()
  }, [user, router])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...DEFAULTS, ...data })
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const session = getSession()
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`,
        },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Fehler beim Speichern. Bitte versuchen Sie es erneut.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const session = getSession()
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.token}` },
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(s => ({ ...s, logoUrl: data.url }))
      } else {
        setError('Logo-Upload fehlgeschlagen')
      }
    } catch {
      setError('Logo-Upload fehlgeschlagen')
    } finally {
      setUploadingLogo(false)
    }
  }

  const set = (field: keyof SiteSettings, value: any) => {
    setSettings(s => ({ ...s, [field]: value }))
  }

  if (!user || !user.isAdmin) return null

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Einstellungen werden geladen...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Einstellungen</h2>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihren Shop — Änderungen werden sofort auf der Website wirksam</p>
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                  saved ? 'bg-green-600 text-white' : saving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-800 hover:bg-brand-700 text-white'
                }`}
              >
                {saving ? 'Speichern...' : saved ? '✓ Gespeichert!' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Branding & Logo</h3>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo preview */}
            <div className="flex-shrink-0">
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-xs text-center">Kein Logo</span>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="mt-2 w-full text-xs text-brand-800 border border-brand-800 px-3 py-1.5 rounded hover:bg-brand-50 transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? 'Hochladen...' : 'Logo hochladen'}
              </button>
              {settings.logoUrl && settings.logoUrl !== '/logo.png' && (
                <button
                  onClick={() => set('logoUrl', '/logo.png')}
                  className="mt-1 w-full text-xs text-gray-500 hover:text-gray-700"
                >
                  Standard wiederherstellen
                </button>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop-Name</label>
                <input type="text" value={settings.storeName} onChange={e => set('storeName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (DE)</label>
                  <textarea value={settings.storeDescription} onChange={e => set('storeDescription', e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                  <textarea value={settings.storeDescriptionEn} onChange={e => set('storeDescriptionEn', e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Homepage Hero */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Homepage Hero-Text</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Haupttitel (DE)</label>
              <input type="text" value={settings.heroTitleDe} onChange={e => set('heroTitleDe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Title (EN)</label>
              <input type="text" value={settings.heroTitleEn} onChange={e => set('heroTitleEn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Untertitel (DE)</label>
              <input type="text" value={settings.heroSubtitleDe} onChange={e => set('heroSubtitleDe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (EN)</label>
              <input type="text" value={settings.heroSubtitleEn} onChange={e => set('heroSubtitleEn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Kontaktinformationen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'E-Mail', field: 'storeEmail' as const, type: 'email' },
              { label: 'Telefon', field: 'storePhone' as const, type: 'tel' },
              { label: 'Adresse', field: 'storeAddress' as const, type: 'text' },
              { label: 'Stadt', field: 'storeCity' as const, type: 'text' },
              { label: 'PLZ', field: 'storePostalCode' as const, type: 'text' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={String(settings[field])} onChange={e => set(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Tax */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Versand & Steuer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kostenloser Versand ab (€)</label>
              <input type="number" step="0.01" value={settings.freeShippingThreshold}
                onChange={e => set('freeShippingThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Versand (€)</label>
              <input type="number" step="0.01" value={settings.standardShippingCost}
                onChange={e => set('standardShippingCost', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steuersatz (%)</label>
              <input type="number" step="0.01" value={settings.taxRate}
                onChange={e => set('taxRate', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Benachrichtigungen</h3>
          <div className="space-y-4">
            {[
              { field: 'orderNotifications' as const, label: 'Bestellbenachrichtigungen', desc: 'E-Mail bei neuen Bestellungen erhalten' },
              { field: 'lowStockAlerts' as const, label: 'Lagerbestand-Warnungen', desc: 'Benachrichtigung bei niedrigem Lagerbestand' },
            ].map(({ field, label, desc }) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings[field] as boolean} onChange={e => set(field, e.target.checked)}
                  className="w-4 h-4 text-brand-800 border-gray-300 rounded focus:ring-brand-800" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Version</p><p className="font-medium">Attireburg v1.0.0</p></div>
            <div><p className="text-gray-500">Datenbank</p><p className="font-medium">PostgreSQL / Supabase</p></div>
            <div><p className="text-gray-500">Status</p><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span></div>
            <div><p className="text-gray-500">Next.js</p><p className="font-medium">14.2.15</p></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
