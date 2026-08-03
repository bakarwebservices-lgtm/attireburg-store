'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface LinkedVariant {
  id: string
  sku: string
  stock: number
  attributes: Record<string, string>
  isActive: boolean
  product: {
    id: string
    name: string
    images: string[]
  }
}

interface PoolDetail {
  id: string
  name: string
  garmentType: string
  attributes: Record<string, string>
  canonicalKey: string
  stock: number
  reservedStock: number
  availableStock: number
  notes?: string
  isActive: boolean
  createdAt: string
  linkedVariants: LinkedVariant[]
}

export default function PoolDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const poolId = params.id as string

  const [pool, setPool] = useState<PoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit fields
  const [name, setName] = useState('')
  const [stock, setStock] = useState(0)
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    if (poolId) {
      fetchPoolDetail()
    }
  }, [user, isLoading, poolId])

  const fetchPoolDetail = async () => {
    setLoading(true)
    try {
      const session = getSession()
      const res = await fetch(`/api/admin/pools/${poolId}`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      })
      if (!res.ok) throw new Error('Pool nicht gefunden')
      const data = await res.json()
      setPool(data.pool)
      setName(data.pool.name)
      setStock(data.pool.stock)
      setNotes(data.pool.notes || '')
    } catch (err) {
      console.error('Error loading pool:', err)
      alert('Pool konnte nicht geladen werden')
      router.push('/admin/pools')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const session = getSession()
      const res = await fetch(`/api/admin/pools/${poolId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          name,
          stock: Number(stock),
          notes,
          reason
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      alert('Pool erfolgreich aktualisiert!')
      setReason('')
      fetchPoolDetail()
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlinkVariant = async (variantId: string, productName: string) => {
    if (!confirm(`Verknüpfung der Variante von "${productName}" mit diesem Pool aufheben? Die Variante nutzt danach ihren eigenen Bestand.`)) {
      return
    }

    try {
      const session = getSession()
      const res = await fetch(`/api/admin/pools/${poolId}/link`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({ variantId })
      })

      if (!res.ok) throw new Error('Fehler beim Aufheben der Verknüpfung')
      alert('Verknüpfung aufgehoben.')
      fetchPoolDetail()
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  const handleDeletePool = async () => {
    if (pool?.linkedVariants && pool.linkedVariants.length > 0) {
      alert(`Dieser Pool kann nicht gelöscht werden, da noch ${pool.linkedVariants.length} Varianten damit verknüpft sind. Bitte heben Sie zuerst die Verknüpfungen auf.`)
      return
    }

    if (!confirm('Möchten Sie diesen Garment Pool wirklich löschen?')) return

    try {
      const session = getSession()
      const res = await fetch(`/api/admin/pools/${poolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Löschen')

      alert(data.message || 'Pool gelöscht.')
      router.push('/admin/pools')
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  if (!user || !user.isAdmin) return null
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">Pool wird geladen...</div>
      </DashboardLayout>
    )
  }

  if (!pool) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/admin/pools')} className="text-gray-500 hover:text-gray-900 text-sm">
                ← Garment Pools
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{pool.name}</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Canonical Key: {pool.canonicalKey}</p>
          </div>
          <button
            onClick={handleDeletePool}
            className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium self-start sm:self-auto"
          >
            Pool Löschen / Deaktivieren
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Gesamter Physischer Lagerbestand</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{pool.stock} Stück</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Reserviert (Warenkorb / Checkout Holds)</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pool.reservedStock} Stück</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Sofort Verfügbar für Verkauf</span>
            <div className="text-2xl font-bold text-green-600 mt-1">{pool.availableStock} Stück</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Edit Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Pool-Details Bearbeiten</h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bezeichnung</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lagerbestand Anpassen</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grund der Bestandsänderung (Audit)</label>
                <input
                  type="text"
                  placeholder="z. B. Nachlieferung von Lieferant X erhalten"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notizen (Charge / Herkunft)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Physische Eigenschaften (Read-only)</label>
                <div className="p-2 bg-gray-50 border rounded-lg flex flex-wrap gap-1">
                  {Object.entries(pool.attributes || {}).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-white border rounded text-xs text-gray-700">
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Speichert...' : 'Änderungen Speichern'}
              </button>
            </form>
          </div>

          {/* Right Column: Linked Designs */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Verknüpfte Druck-Designs ({pool.linkedVariants.length})
              </h2>
              <span className="text-xs text-gray-500">
                Alle folgenden Produkte teilen sich diesen physischen Bestand.
              </span>
            </div>

            {pool.linkedVariants.length === 0 ? (
              <div className="p-6 text-center text-gray-500 border rounded-lg bg-gray-50 text-sm">
                Keine Varianten mit diesem Pool verknüpft. Verknüpfen Sie Varianten beim Erstellen oder Bearbeiten eines Produkts.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b text-gray-700 font-medium text-xs">
                    <tr>
                      <th className="px-3 py-2">Produkt Design</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Varianten-Attribute</th>
                      <th className="px-3 py-2 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pool.linkedVariants.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {v.product.name}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">{v.sku}</td>
                        <td className="px-3 py-2 text-xs">
                          {Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' • ')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleUnlinkVariant(v.id, v.product.name)}
                            className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100"
                          >
                            Verknüpfung aufheben
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
