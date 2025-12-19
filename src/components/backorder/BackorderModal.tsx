'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface BackorderModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    nameEn: string
    price: number
    salePrice?: number
    currency: string
    image?: string
  }
  variant?: {
    id: string
    sku: string
    attributes: Record<string, string>
  }
  selectedSize: string
  selectedColor: string
  quantity: number
  expectedFulfillmentDate?: Date
}

export default function BackorderModal({
  isOpen,
  onClose,
  product,
  variant,
  selectedSize,
  selectedColor,
  quantity,
  expectedFulfillmentDate
}: BackorderModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: ''
  })

  if (!isOpen) return null

  const currentPrice = product.salePrice || product.price
  const totalAmount = currentPrice * quantity

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: product.currency
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const handleBackorderSubmit = async () => {
    if (!user) {
      alert('Bitte melden Sie sich an, um eine Vorbestellung aufzugeben')
      return
    }

    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
      alert('Bitte füllen Sie alle Versandinformationen aus')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/backorders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          items: [{
            productId: product.id,
            variantId: variant?.id,
            quantity,
            size: selectedSize,
            color: selectedColor,
            price: currentPrice
          }],
          totalAmount,
          currency: product.currency,
          shippingAddress: shippingInfo.address,
          shippingCity: shippingInfo.city,
          shippingPostal: shippingInfo.postalCode,
          expectedFulfillmentDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Vorbestellung erfolgreich aufgegeben!')
        onClose()
        // Redirect to order confirmation or account page
        window.location.href = `/account/orders`
      } else {
        alert(data.error || 'Fehler beim Aufgeben der Vorbestellung')
      }
    } catch (error) {
      console.error('Error creating backorder:', error)
      alert('Fehler beim Aufgeben der Vorbestellung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Vorbestellung aufgeben</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6">
            <div className="flex items-start space-x-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                {variant && (
                  <p className="text-sm text-gray-600">
                    {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg font-bold text-primary-600">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-sm text-gray-600">× {quantity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Fulfillment */}
          {expectedFulfillmentDate && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Voraussichtliche Lieferung
                  </p>
                  <p className="text-sm text-blue-700">
                    {formatDate(expectedFulfillmentDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Versandinformationen</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Straße und Hausnummer"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="PLZ"
                  value={shippingInfo.postalCode}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Stadt"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Zwischensumme</span>
              <span className="font-semibold">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Versand</span>
              <span className="text-green-600">Kostenlos</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">Gesamt</span>
                <span className="font-bold text-lg text-primary-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">Wichtige Hinweise</p>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  <li>• Zahlung erfolgt sofort bei Bestellaufgabe</li>
                  <li>• Kostenlose Stornierung jederzeit möglich</li>
                  <li>• Sie erhalten eine Bestätigung per E-Mail</li>
                  <li>• Benachrichtigung bei Versand</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleBackorderSubmit}
              disabled={loading || !user}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Wird bearbeitet...' : `${formatPrice(totalAmount)} vorbestellen`}
            </button>
          </div>

          {!user && (
            <p className="text-sm text-red-600 text-center mt-3">
              Bitte melden Sie sich an, um eine Vorbestellung aufzugeben.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}