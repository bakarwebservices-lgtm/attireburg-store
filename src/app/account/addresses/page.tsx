'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface Address {
  id: string
  label: string
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export default function Addresses() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    label: lang === 'de' ? 'Zu Hause' : 'Home',
    firstName: '', lastName: '', street: '', city: '', postalCode: '',
    country: 'Deutschland', phone: '', isDefault: false
  })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    // Load from localStorage for now (no dedicated addresses DB table)
    const stored = localStorage.getItem(`addresses_${user.id}`)
    if (stored) setAddresses(JSON.parse(stored))
  }, [user, router])

  const save = () => {
    if (!user) return
    setSaving(true)
    const newAddr: Address = { ...form, id: Date.now().toString() }
    const updated = form.isDefault
      ? [newAddr, ...addresses.map(a => ({ ...a, isDefault: false }))]
      : [...addresses, newAddr]
    setAddresses(updated)
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(updated))
    setShowForm(false)
    setForm({ label: lang === 'de' ? 'Zu Hause' : 'Home', firstName: '', lastName: '', street: '', city: '', postalCode: '', country: 'Deutschland', phone: '', isDefault: false })
    setMsg(lang === 'de' ? 'Adresse gespeichert.' : 'Address saved.')
    setTimeout(() => setMsg(''), 3000)
    setSaving(false)
  }

  const remove = (id: string) => {
    if (!user) return
    const updated = addresses.filter(a => a.id !== id)
    setAddresses(updated)
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(updated))
  }

  const setDefault = (id: string) => {
    if (!user) return
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }))
    setAddresses(updated)
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(updated))
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 text-sm"

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              {lang === 'de' ? 'Meine Adressen' : 'My Addresses'}
            </h2>
            <button onClick={() => setShowForm(!showForm)}
              className="bg-brand-800 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + {lang === 'de' ? 'Neue Adresse' : 'New Address'}
            </button>
          </div>
          {msg && <p className="text-green-600 text-sm mt-1">{msg}</p>}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{lang === 'de' ? 'Neue Adresse hinzufügen' : 'Add new address'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Bezeichnung' : 'Label'}</label>
                <input type="text" value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Vorname' : 'First name'}</label>
                <input type="text" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Nachname' : 'Last name'}</label>
                <input type="text" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Telefon' : 'Phone'}</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Straße & Hausnummer' : 'Street & number'}</label>
                <input type="text" value={form.street} onChange={e => setForm(f => ({...f, street: e.target.value}))} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PLZ</label>
                <input type="text" value={form.postalCode} onChange={e => setForm(f => ({...f, postalCode: e.target.value}))} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'de' ? 'Stadt' : 'City'}</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inputClass} required />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({...f, isDefault: e.target.checked}))}
                className="w-4 h-4 text-brand-800 border-gray-300 rounded" />
              {lang === 'de' ? 'Als Standardadresse setzen' : 'Set as default address'}
            </label>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving || !form.firstName || !form.street || !form.city}
                className="bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors">
                {lang === 'de' ? 'Speichern' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm px-5 py-2 rounded-lg transition-colors">
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Address list */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📍</div>
            <p className="font-medium">{lang === 'de' ? 'Noch keine Adressen gespeichert' : 'No addresses saved yet'}</p>
            <p className="text-sm mt-1">{lang === 'de' ? 'Fügen Sie eine Lieferadresse hinzu.' : 'Add a delivery address.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(addr => (
              <div key={addr.id} className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-xs bg-brand-50 text-brand-800 px-2 py-0.5 rounded font-medium">
                          {lang === 'de' ? 'Standard' : 'Default'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{addr.firstName} {addr.lastName}</p>
                    <p className="text-sm text-gray-600">{addr.street}</p>
                    <p className="text-sm text-gray-600">{addr.postalCode} {addr.city}, {addr.country}</p>
                    {addr.phone && <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    {!addr.isDefault && (
                      <button onClick={() => setDefault(addr.id)}
                        className="text-xs text-brand-800 hover:text-brand-700 font-medium">
                        {lang === 'de' ? 'Standard' : 'Set default'}
                      </button>
                    )}
                    <button onClick={() => remove(addr.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium">
                      {lang === 'de' ? 'Löschen' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
