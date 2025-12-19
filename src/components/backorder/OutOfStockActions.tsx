'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface OutOfStockActionsProps {
  productId: string
  variantId?: string
  productName: string
  productNameEn: string
  currentPrice: number
  currency: string
  expectedRestockDate?: Date
  onBackorderClick: () => void
}

export default function OutOfStockActions({
  productId,
  variantId,
  productName,
  productNameEn,
  currentPrice,
  currency,
  expectedRestockDate,
  onBackorderClick
}: OutOfStockActionsProps) {
  const { user } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
      checkSubscriptionStatus()
    }
  }, [user, productId, variantId])

  const checkSubscriptionStatus = async () => {
    if (!user?.email) return

    try {
      const params = new URLSearchParams({
        email: user.email,
        productId,
        ...(variantId && { variantId })
      })

      const response = await fetch(`/api/waitlist/subscribe?${params}`)
      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const handleWaitlistSubscribe = async () => {
    if (!email) {
      alert('Bitte geben Sie Ihre E-Mail-Adresse ein')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/waitlist/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          productId,
          variantId,
          userId: user?.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubscribed(true)
        alert('Sie wurden erfolgreich zur Warteliste hinzugefügt!')
      } else {
        alert(data.error || 'Fehler beim Hinzufügen zur Warteliste')
      }
    } catch (error) {
      console.error('Error subscribing to waitlist:', error)
      alert('Fehler beim Hinzufügen zur Warteliste')
    } finally {
      setLoading(false)
    }
  }

  const handleWaitlistUnsubscribe = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/waitlist/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          productId,
          variantId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubscribed(false)
        alert('Sie wurden erfolgreich von der Warteliste entfernt')
      } else {
        alert(data.error || 'Fehler beim Entfernen von der Warteliste')
      }
    } catch (error) {
      console.error('Error unsubscribing from waitlist:', error)
      alert('Fehler beim Entfernen von der Warteliste')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span className="font-semibold text-red-600">Nicht verfügbar</span>
      </div>

      {/* Expected Restock Date */}
      {expectedRestockDate && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Voraussichtlich wieder verfügbar:</span>{' '}
          {formatDate(expectedRestockDate)}
        </div>
      )}

      {/* Waitlist Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Benachrichtigung bei Verfügbarkeit</h4>
        
        {!user && (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        {isSubscribed ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Sie stehen auf der Warteliste</span>
            </div>
            <p className="text-sm text-gray-600">
              Sie erhalten eine E-Mail, sobald das Produkt wieder verfügbar ist.
            </p>
            <button
              onClick={handleWaitlistUnsubscribe}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
            >
              {loading ? 'Wird entfernt...' : 'Von Warteliste entfernen'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleWaitlistSubscribe}
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Wird hinzugefügt...' : 'Benachrichtigung aktivieren'}
          </button>
        )}
      </div>

      {/* Backorder Section */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900">Vorbestellen</h4>
        <p className="text-sm text-gray-600">
          Bestellen Sie jetzt vor und erhalten Sie das Produkt, sobald es wieder verfügbar ist.
          {expectedRestockDate && (
            <span className="block mt-1">
              Voraussichtliche Lieferung: {formatDate(expectedRestockDate)}
            </span>
          )}
        </p>
        <button
          onClick={onBackorderClick}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Für {formatPrice(currentPrice)} vorbestellen
        </button>
        <p className="text-xs text-gray-500">
          Zahlung erfolgt sofort. Kostenlose Stornierung jederzeit möglich.
        </p>
      </div>
    </div>
  )
}