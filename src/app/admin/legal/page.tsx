'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

const PAGES = [
  { id: 'imprint', labelDe: 'Impressum', labelEn: 'Imprint', href: '/imprint' },
  { id: 'privacy', labelDe: 'Datenschutzerklärung', labelEn: 'Privacy Policy', href: '/privacy' },
  { id: 'terms', labelDe: 'AGB', labelEn: 'Terms & Conditions', href: '/terms' },
]

export default function AdminLegal() {
  const { user } = useAuth()
  const router = useRouter()
  const [activePage, setActivePage] = useState('imprint')
  const [contents, setContents] = useState<Record<string, { contentDe: string; contentEn: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/account'); return }
    loadAll()
  }, [user, router])

  const loadAll = async () => {
    setLoading(true)
    const loaded: Record<string, { contentDe: string; contentEn: string }> = {}
    await Promise.all(
      PAGES.map(async p => {
        try {
          const res = await fetch(`/api/admin/legal?id=${p.id}`)
          if (res.ok) {
            const data = await res.json()
            loaded[p.id] = data
              ? { contentDe: data.contentDe, contentEn: data.contentEn }
              : { contentDe: '', contentEn: '' }
          } else {
            loaded[p.id] = { contentDe: '', contentEn: '' }
          }
        } catch {
          loaded[p.id] = { contentDe: '', contentEn: '' }
        }
      })
    )
    setContents(loaded)
    setLoading(false)
  }

  const handleSave = async () => {
    const session = getSession()
    if (!session?.token) return
    setSaving(true)
    setError('')
    try {
      const current = contents[activePage]
      if (!current) return
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ id: activePage, ...current }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const setContent = (field: 'contentDe' | 'contentEn', value: string) => {
    setContents(prev => ({
      ...prev,
      [activePage]: { ...prev[activePage], [field]: value },
    }))
  }

  if (!user || !user.isAdmin) return null

  const current = contents[activePage] || { contentDe: '', contentEn: '' }
  const activePageMeta = PAGES.find(p => p.id === activePage)!

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Rechtliche Seiten</h2>
              <p className="text-gray-600 mt-1">
                Impressum, Datenschutz und AGB bearbeiten — Änderungen werden sofort live
              </p>
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Link
                href={activePageMeta.href}
                target="_blank"
                className="text-sm text-gray-500 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Vorschau ↗
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-800 hover:bg-brand-700 text-white'
                }`}
              >
                {saving ? 'Speichern...' : saved ? '✓ Gespeichert!' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>

        {/* Page tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {PAGES.map(p => (
              <button
                key={p.id}
                onClick={() => { setActivePage(p.id); setSaved(false); setError('') }}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  activePage === p.id
                    ? 'text-brand-800 border-b-2 border-brand-800 bg-brand-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {p.labelDe}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Wird geladen...</div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Inhalt als einfacher Text oder HTML eingeben. Zeilenumbrüche werden als Absätze dargestellt.
                Wenn das Feld leer ist, wird der Standard-Inhalt aus dem Code verwendet.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Deutsch (DE)
                  </label>
                  <span className="text-xs text-gray-400">{current.contentDe.length} Zeichen</span>
                </div>
                <textarea
                  value={current.contentDe}
                  onChange={e => setContent('contentDe', e.target.value)}
                  rows={16}
                  placeholder="Deutschen Inhalt hier eingeben..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent resize-y"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    English (EN)
                  </label>
                  <span className="text-xs text-gray-400">{current.contentEn.length} Zeichen</span>
                </div>
                <textarea
                  value={current.contentEn}
                  onChange={e => setContent('contentEn', e.target.value)}
                  rows={16}
                  placeholder="Enter English content here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent resize-y"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
