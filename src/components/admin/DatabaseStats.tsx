'use client'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/session'

export default function DatabaseStats() {
  const [status, setStatus] = useState<'healthy' | 'unhealthy' | null>(null)
  const [timestamp, setTimestamp] = useState('')
  const [counts, setCounts] = useState<{ products: number; users: number; orders: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchInfo() }, [])

  const fetchInfo = async () => {
    setLoading(true)
    setError('')
    try {
      const healthRes = await fetch('/api/health')
      const healthData = await healthRes.json()
      setStatus(healthData.status === 'healthy' ? 'healthy' : 'unhealthy')
      setTimestamp(healthData.timestamp || new Date().toISOString())

      const session = getSession()
      if (session?.token) {
        const dashRes = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (dashRes.ok) {
          const dash = await dashRes.json()
          setCounts({ products: dash.totalProducts ?? 0, users: dash.totalUsers ?? 0, orders: dash.totalOrders ?? 0 })
        }
      }
    } catch (err) {
      setStatus('unhealthy')
      setError(err instanceof Error ? err.message : 'Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-200 rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900">Datenbank Status</h3>
        <button onClick={fetchInfo} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-1 rounded transition-colors">
          Aktualisieren
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <div className={`w-3 h-3 rounded-full ${status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className={`text-sm font-medium ${status === 'healthy' ? 'text-green-700' : 'text-red-700'}`}>
          {status === 'healthy' ? 'Verbunden' : 'Getrennt'}
        </span>
        {timestamp && (
          <span className="text-xs text-gray-400 ml-1">
            {new Date(timestamp).toLocaleTimeString('de-DE')}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {counts && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{counts.products}</div>
            <div className="text-xs text-gray-500 mt-0.5">Produkte</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{counts.users}</div>
            <div className="text-xs text-gray-500 mt-0.5">Benutzer</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{counts.orders}</div>
            <div className="text-xs text-gray-500 mt-0.5">Bestellungen</div>
          </div>
        </div>
      )}
    </div>
  )
}
