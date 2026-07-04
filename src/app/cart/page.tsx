'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { calculateVATFromGross } from '@/lib/vat'

export default function Cart() {
  const { lang } = useLanguage()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems, appliedCoupon, setAppliedCoupon, discountedTotal } = useCart()
  const { user } = useAuth()
  const t = translations[lang]
  const [promoCode, setPromoCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [siteSettings, setSiteSettings] = useState<{
    freeShippingThreshold: number
    standardShippingCost: number
    taxRate: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSiteSettings(data)
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err))
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const settings = siteSettings || {
    freeShippingThreshold: 50,
    standardShippingCost: 4.99,
    taxRate: 19
  }

  const shippingCost = discountedTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingCost
  const finalTotal = discountedTotal + shippingCost

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: totalPrice }),
      })
      const data = await res.json()
      if (res.ok) {
        setAppliedCoupon({ ...data.coupon, discountAmount: data.discountAmount })
        setPromoCode('')
      } else {
        setCouponError(data.error || 'Ungültiger Code')
      }
    } catch {
      setCouponError('Fehler beim Prüfen des Codes')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t.cart.empty.title}
            </h1>
            <p className="text-gray-600 mb-8">
              {t.cart.empty.subtitle}
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {t.cart.empty.shopNow}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
          {t.cart.title} ({totalItems} {t.cart.items})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                {/* Regular Items */}
                {items.filter(item => !item.isBackorder).length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Sofort lieferbar
                    </h3>
                    {items.filter(item => !item.isBackorder).map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 py-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={lang === 'de' ? item.name : item.nameEn}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{t.common.noImage}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {lang === 'de' ? item.name : item.nameEn}
                          </h3>
                          {item.isBackorder && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Vorbestellung
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {item.size && <span>{t.cart.size}: {item.size}</span>}
                          {item.color && <span>{t.cart.color}: {item.color}</span>}
                          {item.isBackorder && item.expectedFulfillmentDate && (
                            <span className="text-orange-600">
                              Lieferung: {new Intl.DateTimeFormat('de-DE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }).format(item.expectedFulfillmentDate)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={!item.isBackorder && item.quantity >= item.stock}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            {t.cart.remove}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex flex-col items-end space-y-1">
                          {item.salePrice ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(item.salePrice * item.quantity)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          )}
                          <span className="text-sm text-gray-600">
                            {formatPrice(item.salePrice || item.price)} {t.common.perPiece}
                          </span>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {/* Backorder Items */}
                {items.filter(item => item.isBackorder).length > 0 && (
                  <div className="space-y-6 mt-8">
                    <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Vorbestellungen
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Zahlung sofort, Lieferung bei Verfügbarkeit
                      </span>
                    </div>
                    {items.filter(item => item.isBackorder).map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 py-4 border-b border-gray-200 last:border-b-0 bg-orange-50 rounded-lg px-3 sm:px-4">
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={lang === 'de' ? item.name : item.nameEn}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">{t.common.noImage}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {lang === 'de' ? item.name : item.nameEn}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Vorbestellung
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            {item.size && <span>{t.cart.size}: {item.size}</span>}
                            {item.color && <span>{t.cart.color}: {item.color}</span>}
                            {item.expectedFulfillmentDate && (
                              <span className="text-orange-600 font-medium">
                                Voraussichtliche Lieferung: {new Intl.DateTimeFormat('de-DE', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }).format(item.expectedFulfillmentDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              {t.cart.remove}
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex flex-col items-end space-y-1">
                            {item.salePrice ? (
                              <>
                                <span className="text-lg font-bold text-red-600">
                                  {formatPrice(item.salePrice * item.quantity)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            )}
                            <span className="text-sm text-gray-600">
                              {formatPrice(item.salePrice || item.price)} {t.common.perPiece}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={clearCart}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                    >
                      {t.cart.clear}
                    </button>
                    <Link
                      href="/products"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      {t.cart.continueShopping}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t.cart.summary}
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.cart.promoCode}
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-mono font-semibold text-green-800 text-sm">{appliedCoupon.code}</span>
                      <span className="ml-2 text-green-700 text-sm">
                        -{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `€${appliedCoupon.discountValue.toFixed(2)}`}
                      </span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-green-700 hover:text-green-900 text-xs underline ml-2">
                      Entfernen
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setCouponError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder={t.cart.promoPlaceholder}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent text-sm uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                    >
                      {couponLoading ? '...' : t.cart.apply}
                    </button>
                  </div>
                )}
                {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t.cart.subtotal} ({totalItems} {t.cart.items})</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.cart.shipping}</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">{t.cart.freeShipping}</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-gray-500">
                    {t.cart.freeShippingNote} {formatPrice(settings.freeShippingThreshold)}
                  </p>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-green-700">
                    <span>Rabatt ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{t.cart.total}</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t.common.vatAmount}</span>
                    <span>{formatPrice(calculateVATFromGross(finalTotal, settings.taxRate).vatAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {t.common.vatIncluded.replace('19', settings.taxRate.toString())}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="space-y-3">
                {user ? (
                  <Link
                    href="/checkout"
                    className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                  >
                    {t.cart.checkout}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login?redirect=/checkout"
                      className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                    >
                      {t.cart.loginToCheckout}
                    </Link>
                    <Link
                      href="/register?redirect=/checkout"
                      className="w-full border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                    >
                      {t.cart.createAccount}
                    </Link>
                  </div>
                )}
                
                <Link
                  href={user ? "/checkout?payment=paypal" : "/login?redirect=/checkout?payment=paypal"}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  {t.cart.paypalExpress}
                </Link>
              </div>

              {/* Security Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t.cart.security.ssl}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t.cart.security.returns}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}