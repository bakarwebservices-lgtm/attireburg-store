'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface LinkedVariant {
  id: string
  sku: string
  isActive: boolean
  product: {
    id: string
    name: string
  }
}

interface BlankGarmentPool {
  id: string
  name: string
  garmentType: string
  attributes: Record<string, string>
  stock: number
  notes?: string
  isActive: boolean
  createdAt: string
  linkedVariants: LinkedVariant[]
  totalLinkedCount: number
  activeLinkedCount: number
  isOrphaned: boolean
}

const COMMON_GARMENT_TYPES = [
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'sweater', label: 'Sweater' },
  { value: 'tanktop', label: 'Tank Top' },
  { value: 'jacket', label: 'Jacke' },
  { value: 'cap', label: 'Kappe / Mütze' },
]

export default function GarmentPoolsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [pools, setPools] = useState<BlankGarmentPool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrphaned, setFilterOrphaned] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create modal state
  const [newPoolName, setNewPoolName] = useState('')
  const [newGarmentType, setNewGarmentType] = useState('tshirt')
  const [newStock, setNewStock] = useState(10)
  const [newNotes, setNewNotes] = useState('')
  const [attributeRows, setAttributeRows] = useState<Array<{ key: string; value: string }>>([
    { key: 'fit', value: 'Slim Fit' },
    { key: 'size', value: 'M' },
    { key: 'color', value: 'Schwarz' },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    fetchPools()
  }, [user, isLoading, filterOrphaned])

  const fetchPools = async () => {
    setLoading(true)
    try {
      const session = getSession()
      const url = filterOrphaned ? '/api/admin/pools?orphaned=true' : '/api/admin/pools'
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      })
      if (!res.ok) throw new Error('Failed to load pools')
      const data = await res.json()
      setPools(data.pools || [])
    } catch (err) {
      console.error('Error fetching pools:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPoolName.trim()) { alert('Pool-Name ist erforderlich'); return }

    const attributes: Record<string, string> = {}
    for (const row of attributeRows) {
      if (row.key.trim() && row.value.trim()) {
        attributes[row.key.trim()] = row.value.trim()
      }
    }

    if (Object.keys(attributes).length === 0) {
      alert('Mindestens eine Eigenschaft (z. B. Größe, Farbe) ist erforderlich')
      return
    }

    setSubmitting(true)
    try {
      const session = getSession()
      const res = await fetch('/api/admin/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          name: newPoolName,
          garmentType: newGarmentType,
          attributes,
          stock: Number(newStock),
          notes: newNotes
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen')

      if (data.existing) {
        alert(`Ein Pool mit diesen Eigenschaften existierte bereits ("${data.pool.name}").`)
      } else {
        alert('Garment Pool erfolgreich erstellt!')
      }

      setShowCreateModal(false)
      setNewPoolName('')
      setNewNotes('')
      fetchPools()
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPools = pools.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.garmentType.toLowerCase().includes(search.toLowerCase()) ||
    Object.values(p.attributes || {}).some(val => val.toLowerCase().includes(search.toLowerCase()))
  )

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Garment Pools (Unbedruckte Textilien)</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Verwalten Sie physische Rohware-Bestände (z. B. 10 Schwarze Slim Fit T-Shirts in S), die von mehreren Druck-Designs geteilt werden.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span>➕</span> Neuer Garment Pool
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Pools durchsuchen (Farbe, Größe, Typ)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={filterOrphaned}
                onChange={e => setFilterOrphaned(e.target.checked)}
                className="rounded text-gray-900 focus:ring-gray-900"
              />
              <span>Nur ungenutzte Pools ("Orphaned Pools" mit Bestand &gt; 0)</span>
            </label>
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Pools werden geladen...</div>
          ) : filteredPools.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Keine Garment Pools gefunden. Erstellen Sie den ersten Pool für Ihre Rohware!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium">
                  <tr>
                    <th className="px-4 py-3">Pool Name</th>
                    <th className="px-4 py-3">Textiltyp</th>
                    <th className="px-4 py-3">Eigenschaften</th>
                    <th className="px-4 py-3 text-center">Physischer Bestand</th>
                    <th className="px-4 py-3 text-center">Verknüpfte Designs</th>
                    <th className="px-4 py-3 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPools.map(pool => (
                    <tr key={pool.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div>{pool.name}</div>
                        {pool.isOrphaned && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                            ⚠️ Keine aktiven Designs verknüpft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{pool.garmentType}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(pool.attributes || {}).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-700">
                              <strong className="capitalize">{k}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          pool.stock === 0 ? 'bg-red-100 text-red-800' :
                          pool.stock <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {pool.stock} Stück
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        <span className="font-semibold text-gray-900">{pool.activeLinkedCount}</span> aktive
                        <span className="text-xs text-gray-400"> ({pool.totalLinkedCount} insg.)</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/pools/${pool.id}`)}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-xs font-medium"
                        >
                          Details & Verknüpfungen →
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Neuen Garment Pool erstellen</h2>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pool Name / Bezeichnung</label>
                <input
                  type="text"
                  placeholder="z. B. T-Shirt Schwarz / S / Slim Fit"
                  value={newPoolName}
                  onChange={e => setNewPoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Textiltyp</label>
                <select
                  value={newGarmentType}
                  onChange={e => setNewGarmentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {COMMON_GARMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Anfangsbestand (Stück)</label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={e => setNewStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Physische Eigenschaften</label>
                  <button
                    type="button"
                    onClick={() => setAttributeRows([...attributeRows, { key: '', value: '' }])}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Eigenschaft
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                  {attributeRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.key}
                        onChange={e => {
                          const newRows = [...attributeRows]
                          newRows[idx].key = e.target.value
                          setAttributeRows(newRows)
                        }}
                        className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="fit">Passform (fit)</option>
                        <option value="size">Größe (size)</option>
                        <option value="color">Farbe (color)</option>
                        <option value="fabric">Stoff/Material (fabric)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Wert (z. B. Slim Fit, S)"
                        value={row.value}
                        onChange={e => {
                          const newRows = [...attributeRows]
                          newRows[idx].value = e.target.value
                          setAttributeRows(newRows)
                        }}
                        className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notizen (Hersteller, Lieferant, Batch)</label>
                <textarea
                  rows={2}
                  placeholder="z. B. Gildan Softstyle 64000, Charge 2026-A"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? 'Erstelle...' : 'Pool Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
