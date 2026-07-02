'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'

interface MediaFile {
  id: string
  name: string
  path: string
  url: string
  size: number
  mimeType: string
  createdAt: string
}

export default function MediaLibrary() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [copiedUrl, setCopiedUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.push('/login'); return }
    if (!user.isAdmin) { router.push('/admin'); return }
    loadFiles()
  }, [user, isLoading, router])

  const loadFiles = useCallback(async () => {
    const session = getSession()
    if (!session?.token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/media?folder=products', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      } else {
        setError('Fehler beim Laden der Mediathek')
      }
    } catch (e) {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUpload = async (fileList: FileList) => {
    const session = getSession()
    if (!session?.token) return
    setUploading(true)
    setError('')
    let uploaded = 0
    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
          body: formData,
        })
        if (res.ok) uploaded++
      } catch (e) {
        console.error('Upload failed for', file.name)
      }
    }
    setUploading(false)
    if (uploaded > 0) loadFiles()
    else setError('Upload fehlgeschlagen')
  }

  const handleDelete = async () => {
    if (!selected.length) return
    if (!confirm(`${selected.length} Datei(en) endgültig löschen?`)) return
    const session = getSession()
    if (!session?.token) return
    try {
      const paths = files.filter(f => selected.includes(f.id)).map(f => f.path)
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ paths }),
      })
      if (res.ok) {
        setFiles(prev => prev.filter(f => !selected.includes(f.id)))
        setSelected([])
      }
    } catch (e) {
      setError('Fehler beim Löschen')
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(''), 2000)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const fmt = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Mediathek</h2>
              <p className="text-gray-600 mt-1">
                Alle in Supabase Storage hochgeladenen Produktbilder — {files.length} Dateien
              </p>
            </div>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <button onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                  {selected.length} löschen
                </button>
              )}
              <input ref={fileInputRef} type="file" multiple accept="image/*"
                onChange={e => e.target.files && handleUpload(e.target.files)} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-4 py-2 bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors">
                {uploading ? 'Hochladen...' : 'Bilder hochladen'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Dateinamen suchen..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-800 w-full sm:w-56" />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <span className="text-sm text-gray-500">{selected.length} ausgewählt</span>
            )}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {(['grid', 'list'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm transition-colors ${viewMode === mode ? 'bg-brand-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {mode === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🖼️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'Keine Ergebnisse' : 'Noch keine Bilder'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {search ? 'Anderer Suchbegriff' : 'Laden Sie Produktbilder über das Formular "Produkt hinzufügen" hoch oder direkt hier.'}
              </p>
              {!search && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white text-sm rounded-lg transition-colors">
                  Bilder hochladen
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map(file => (
                <div key={file.id}
                  className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                    selected.includes(file.id) ? 'border-brand-800' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => toggleSelect(file.id)}>
                  <div className="aspect-square bg-gray-100">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{fmt(file.size)}</p>
                  </div>
                  {/* Copy URL button on hover */}
                  <button
                    onClick={e => { e.stopPropagation(); copyUrl(file.url) }}
                    className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-xs px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedUrl === file.url ? '✓' : 'URL'}
                  </button>
                  {selected.includes(file.id) && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-brand-800 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datei</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Größe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(file => (
                    <tr key={file.id} onClick={() => toggleSelect(file.id)}
                      className={`cursor-pointer ${selected.includes(file.id) ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded" />
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmt(file.size)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); copyUrl(file.url) }}
                          className="text-brand-800 hover:text-brand-700 text-xs font-medium">
                          {copiedUrl === file.url ? '✓ Kopiert' : 'URL kopieren'}
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
    </DashboardLayout>
  )
}
