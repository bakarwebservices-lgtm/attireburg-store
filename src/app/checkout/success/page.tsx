'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function CheckoutSuccess() {
  const { lang } = useLanguage()
  const t = translations[lang]

  // Generate a mock order number
  const orderNumber = `ATB-${Date.now().toString().slice(-6)}`

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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                In Bearbeitung
              </span>
            </div>
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