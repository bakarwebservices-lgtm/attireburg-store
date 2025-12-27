'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { useCart } from '@/contexts/CartContext'
import { translations } from '@/lib/translations'

interface OrderDetails {
  orderId: string
  orderNumber: string
  status: string
  totalAmount: number
  paymentMethod: string
}

function CheckoutSuccessContent() {
  const { lang } = useLanguage()
  const { clearCart } = useCart()
  const t = translations[lang]
  const searchParams = useSearchParams()
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handlePayPalReturn = async () => {
      const paypalOrderId = searchParams.get('token')
      const payerId = searchParams.get('PayerID')
      const isDemo = searchParams.get('demo') === 'true'
      
      if (isDemo) {
        // Demo mode - show success without real payment processing
        const orderId = searchParams.get('orderId')
        if (orderId) {
          setOrderDetails({
            orderId,
            orderNumber: `ATB-${orderId.slice(-6).toUpperCase()}`,
            status: 'DEMO',
            totalAmount: 0,
            paymentMethod: 'Demo-Zahlung'
          })
          clearCart()
        }
        setLoading(false)
        return
      }
      
      if (paypalOrderId && payerId) {
        // Handle PayPal return
        try {
          const session = localStorage.getItem('attireburg_session')
          const token = session ? JSON.parse(session).token : null
          const pendingOrderId = localStorage.getItem('pending_order_id')
          
          if (!token || !pendingOrderId) {
            setError('Sitzung abgelaufen. Bitte versuchen Sie es erneut.')
            return
          }

          // Capture PayPal payment
          const response = await fetch('/api/payments/paypal/capture-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              paypalOrderId,
              orderId: pendingOrderId
            }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            // Payment successful
            setOrderDetails({
              orderId: pendingOrderId,
              orderNumber: `ATB-${pendingOrderId.slice(-6).toUpperCase()}`,
              status: 'PROCESSING',
              totalAmount: 0, // You might want to fetch this from the order
              paymentMethod: 'PayPal'
            })
            
            // Clear cart and cleanup
            clearCart()
            localStorage.removeItem('pending_order_id')
            localStorage.removeItem('paypal_order_id')
          } else {
            setError('Zahlung konnte nicht abgeschlossen werden')
          }
        } catch (error) {
          console.error('PayPal capture error:', error)
          setError('Fehler beim Abschließen der Zahlung')
        }
      } else {
        // Direct success page access (e.g., from COD)
        const orderId = searchParams.get('orderId')
        if (orderId) {
          setOrderDetails({
            orderId,
            orderNumber: `ATB-${orderId.slice(-6).toUpperCase()}`,
            status: 'PENDING',
            totalAmount: 0,
            paymentMethod: 'Nachnahme'
          })
          clearCart()
        } else {
          setError('Keine Bestellinformationen gefunden')
        }
      }
      
      setLoading(false)
    }

    handlePayPalReturn()
  }, [searchParams, clearCart])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Bestellung wird verarbeitet...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fehler</h1>
          <p className="text-xl text-gray-600 mb-8">{error}</p>
          <Link
            href="/checkout"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Zurück zur Kasse
          </Link>
        </div>
      </div>
    )
  }

  const orderNumber = orderDetails?.orderNumber || `ATB-${Date.now().toString().slice(-6)}`

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Vielen Dank für Ihre Bestellung!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Ihre Bestellung wurde erfolgreich aufgegeben und wird bearbeitet.
        </p>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Bestelldetails
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bestellnummer</h3>
              <p className="text-gray-600 font-mono">{orderNumber}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bestelldatum</h3>
              <p className="text-gray-600">{new Date().toLocaleDateString('de-DE')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lieferzeit</h3>
              <p className="text-gray-600">3-5 Werktage</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                orderDetails?.status === 'PROCESSING' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {orderDetails?.status === 'PROCESSING' ? 'Wird bearbeitet' : 'Ausstehend'}
              </span>
            </div>
            
            {orderDetails?.paymentMethod && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Zahlungsmethode</h3>
                <p className="text-gray-600">{orderDetails.paymentMethod}</p>
              </div>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-primary-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-primary-800 mb-4">
            Was passiert als Nächstes?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-primary-800 mb-1">Bestätigung</h3>
                <p className="text-primary-600 text-sm">
                  Sie erhalten eine Bestätigungs-E-Mail mit allen Details Ihrer Bestellung.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-primary-800 mb-1">Verpackung</h3>
                <p className="text-primary-600 text-sm">
                  Wir verpacken Ihre Artikel sorgfältig und bereiten sie für den Versand vor.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-primary-800 mb-1">Versand</h3>
                <p className="text-primary-600 text-sm">
                  Sie erhalten eine Versandbestätigung mit Tracking-Informationen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Meine Bestellungen anzeigen
          </Link>
          <Link
            href="/products"
            className="border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Weiter einkaufen
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">
            Haben Sie Fragen zu Ihrer Bestellung?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="mailto:info@attireburg.de" className="text-primary-600 hover:text-primary-700">
              info@attireburg.de
            </a>
            <a href="tel:+4930123456789" className="text-primary-600 hover:text-primary-700">
              +49 30 123 456 789
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Bestellbestätigung...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}