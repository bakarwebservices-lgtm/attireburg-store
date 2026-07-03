'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface Coupon {
  id: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  isActive: true,
  expiresAt: '',
}

export default function AdminCoupons() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    fetchCoupons()
  }, [user, isLoading, router])

  const fetchCoupons = async () => {
    const session = getSession()
    const res = await fetch('/api/admin/coupons', {
      headers: { Authorization: `Bearer ${session?.token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setCoupons(data.coupons)
    }
    setLoading(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : '',
      maxUses: c.maxUses ? String(c.maxUses) : '',
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.discountValue) {
      setError('Code und Rabattwert sind erforderlich')
      return
    }
    setSaving(true)
    setError('')
    const session = getSession()
    const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.token}`,
      },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      fetchCoupons()
    } else {
      const data = await res.json()
      setError(data.error || 'Fehler beim Speichern')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Gutschein wirklich löschen?')) return
    const session = getSession()
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.token}` },
    })
    fetchCoupons()
  }

  const toggleActive = async (c: Coupon) => {
    const session = getSession()
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.token}`,
      },
      body: JSON.stringify({ isActive: !c.isActive }),
    })
    fetchCoupons()
  }

  if (!user?.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Gutscheine</h2>
            <p className="text-gray-500 text-sm mt-1">Erstellen und verwalten Sie Rabattcodes</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Neuer Gutschein
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">
              {editingId ? 'Gutschein bearbeiten' : 'Neuen Gutschein erstellen'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="z.B. SOMMER20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800 uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optionale Notiz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rabatttyp *</label>
                <select
                  value={form.discountType}
                  onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="percentage">Prozent (%)</option>
                  <option value="fixed">Fester Betrag (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rabattwert * {form.discountType === 'percentage' ? '(%)' : '(€)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'percentage' ? '10' : '5.00'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestellwert (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="z.B. 50.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max. Verwendungen</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unbegrenzt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ablaufdatum</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 text-brand-800 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Aktiv</label>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-brand-800 hover:bg-brand-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Lädt...</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Noch keine Gutscheine vorhanden. Erstellen Sie Ihren ersten Gutschein.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Rabatt</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 hidden sm:table-cell">Min. Bestellung</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 hidden md:table-cell">Verwendet</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 hidden md:table-cell">Ablauf</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono font-semibold text-gray-900">{c.code}</span>
                          {c.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}%`
                          : `€${c.discountValue.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {c.minOrderAmount ? `€${c.minOrderAmount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString('de-DE')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(c)}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {c.isActive ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="text-sm text-brand-800 hover:text-brand-600 font-medium"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
