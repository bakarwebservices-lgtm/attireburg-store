'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

interface WaitlistSubscription {
  id: string
  productId: string
  productName: string
  productNameEn: string
  variantId?: string
  variantSku?: string
  expectedRestockDate?: Date
  createdAt: Date
}

export default function WaitlistSubscriptions() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const t = translations[lang]
  
  const [subscriptions, setSubscriptions] = useState<WaitlistSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) {
      fetchSubscriptions()
    }
  }, [user])

  const fetchSubscriptions = async () => {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/waitlist/subscriptions?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions.map((sub: any) => ({
          ...sub,
          expectedRestockDate: sub.expectedRestockDate ? new Date(sub.expectedRestockDate) : undefined,
          createdAt: new Date(sub.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error fetching waitlist subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async (subscription: WaitlistSubscription) => {
    if (!user?.email) return

    setUnsubscribing(subscription.id)

    try {
      const response = await fetch('/api/waitlist/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          productId: subscription.productId,
          variantId: subscription.variantId
        })
      })

      if (response.ok) {
        // Remove from local state
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscription.id))
      } else {
        alert('Fehler beim Abmelden von der Warteliste')
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Fehler beim Abmelden von der Warteliste')
    } finally {
      setUnsubscribing(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 0-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0 1 19 0v10z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine Wartelisten-Abonnements
        </h3>
        <p className="text-gray-600 mb-6">
          Sie haben sich noch nicht für Benachrichtigungen über nicht verfügbare Produkte angemeldet.
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
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Über Wartelisten-Benachrichtigungen
            </h3>
            <p className="text-sm text-blue-700">
              Sie erhalten eine E-Mail-Benachrichtigung, sobald eines Ihrer wartenden Produkte wieder verfügbar ist. 
              Die Artikel werden dann für 30 Minuten für Sie reserviert.
            </p>
          </div>
        </div>
      </div>

      {subscriptions.map((subscription) => (
        <div key={subscription.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {lang === 'de' ? subscription.productName : subscription.productNameEn}
                  </h3>
                  
                  {subscription.variantSku && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Variante:</span> {subscription.variantSku}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                      </svg>
                      Angemeldet am {formatDate(subscription.createdAt)}
                    </div>
                  </div>
                  
                  {subscription.expectedRestockDate && (
                    <div className="mt-3 flex items-center text-sm">
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                        </svg>
                        <span className="font-medium">
                          Voraussichtlich wieder verfügbar: {formatDate(subscription.expectedRestockDate)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!subscription.expectedRestockDate && (
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Wiederverfügbarkeitsdatum wird noch bestimmt
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 ml-6">
              <a
                href={`/products/${subscription.productId}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ansehen
              </a>
              
              <button
                onClick={() => handleUnsubscribe(subscription)}
                disabled={unsubscribing === subscription.id}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {unsubscribing === subscription.id ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird abgemeldet...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Abmelden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Sie haben {subscriptions.length} aktive{subscriptions.length === 1 ? 's' : ''} Wartelisten-Abonnement{subscriptions.length === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  )
}