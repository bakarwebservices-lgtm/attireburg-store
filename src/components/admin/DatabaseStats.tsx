'use client'

import { useState, useEffect } from 'react'

interface DatabaseStats {
  users: number
  products: number
  categories: number
  orders?: number
}

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  error?: string
}

export default function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch database test info
      const testResponse = await fetch('/api/test-db')
      const testData = await testResponse.json()

      if (testData.success) {
        setStats(testData.stats)
        setHealth(testData.health)
      } else {
        throw new Error(testData.message || 'Failed to fetch database info')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchDatabaseInfo}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
        <button
          onClick={fetchDatabaseInfo}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Refresh
        </button>
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            health?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className={`text-sm font-medium ${
            health?.status === 'healthy' ? 'text-green-800' : 'text-red-800'
          }`}>
            {health?.status === 'healthy' ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {health?.timestamp && new Date(health.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.products}</div>
            <div className="text-sm text-gray-500">Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.categories}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.users}</div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Health Check
          </a>
          <a
            href="/api/test-db"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Full Test
          </a>
          {process.env.NODE_ENV === 'development' && (
            <a
              href="/api/seed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-800"
            >
              Seed Data
            </a>
          )}
        </div>
      </div>
    </div>
  )
}