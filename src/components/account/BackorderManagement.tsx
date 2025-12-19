'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

interface BackorderItem {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  quantity: number
  size: string
  color?: string
  price: number
}

interface BackorderInfo {
  id: string
  userId: string
  orderType: string
  status: string
  totalAmount: number
  currency: string
  expectedFulfillmentDate?: Date
  backorderPriority: number
  createdAt: Date
  items: BackorderItem[]
}

export default function BackorderManagement() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const t = translations[lang]
  
  const [backorders, setBackorders] = useState<BackorderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchBackorders()
    }
  }, [user])

  const fetchBackorders = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/backorders/status?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setBackorders(data.backorders.map((order: any) => ({
          ...order,
          expectedFulfillmentDate: order.expectedFulfillmentDate ? new Date(order.expectedFulfillmentDate) : undefined,
          createdAt: new Date(order.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error fetching backorders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBackorder = async (orderId: string) => {
    setCancelling(orderId)

    try {
      const response = await fetch('/api/backorders/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      })

      if (response.ok) {
        // Update local state
        setBackorders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'CANCELLED' }
            : order
        ))
      } else {
        alert('Fehler beim Stornieren der Vorbestellung')
      }
    } catch (error) {
      console.error('Error cancelling backorder:', error)
      alert('Fehler beim Stornieren der Vorbestellung')
    } finally {
      setCancelling(null)
    }
  }

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Wartend'
      case 'PROCESSING':
        return 'In Bearbeitung'
      case 'SHIPPED':
        return 'Versandt'
      case 'DELIVERED':
        return 'Zugestellt'
      case 'CANCELLED':
        return 'Storniert'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (backorders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine Vorbestellungen
        </h3>
        <p className="text-gray-600 mb-6">
          Sie haben noch keine Vorbestellungen für nicht verfügbare Produkte aufgegeben.
        </p>
        <a
          href="/products"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Produkte durchsuchen
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Über Vorbestellungen
            </h3>
            <p className="text-sm text-blue-700">
              Vorbestellungen werden in der Reihenfolge der Aufgabe bearbeitet (First-In-First-Out). 
              Sie erhalten eine Benachrichtigung, sobald Ihre Bestellung versandt wird.
            </p>
          </div>
        </div>
      </div>

      {backorders.map((backorder) => (
        <div key={backorder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vorbestellung #{backorder.id.slice(-8).toUpperCase()}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(backorder.status)}`}>
                  {getStatusText(backorder.status)}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                  </svg>
                  Bestellt am {formatDate(backorder.createdAt)}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Priorität #{backorder.backorderPriority}
                </div>
              </div>

              {backorder.expectedFulfillmentDate && (
                <div className="flex items-center text-sm text-green-600 mb-3">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    Voraussichtliche Erfüllung: {formatDate(backorder.expectedFulfillmentDate)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {formatPrice(backorder.totalAmount, backorder.currency)}
              </div>
              {backorder.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelBackorder(backorder.id)}
                  disabled={cancelling === backorder.id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling === backorder.id ? 'Storniere...' : 'Stornieren'}
                </button>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Bestellte Artikel</h4>
            <div className="space-y-3">
              {backorder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </h5>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          {item.variantSku && (
                            <span>SKU: {item.variantSku}</span>
                          )}
                          <span>Größe: {item.size}</span>
                          {item.color && (
                            <span>Farbe: {item.color}</span>
                          )}
                          <span>Menge: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity, backorder.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          {backorder.status === 'PENDING' && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Bearbeitungsfortschritt</span>
                <span>Wartend auf Lagerbestand</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Bestellt</span>
                <span>Lager</span>
                <span>Versand</span>
                <span>Zustellung</span>
              </div>
            </div>
          )}

          {backorder.status === 'PROCESSING' && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Bearbeitungsfortschritt</span>
                <span>In Bearbeitung</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Bestellt</span>
                <span>Lager</span>
                <span>Versand</span>
                <span>Zustellung</span>
              </div>
            </div>
          )}

          {backorder.status === 'SHIPPED' && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Bearbeitungsfortschritt</span>
                <span>Versandt</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Bestellt</span>
                <span>Lager</span>
                <span>Versand</span>
                <span>Zustellung</span>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Sie haben {backorders.length} Vorbestellung{backorders.length === 1 ? '' : 'en'}.
          {backorders.filter(b => b.status === 'PENDING').length > 0 && (
            <span className="block mt-1">
              {backorders.filter(b => b.status === 'PENDING').length} davon warten noch auf Lagerbestand.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}