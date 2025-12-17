'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { calculateVATFromGross } from '@/lib/vat'

export default function Cart() {
  const { lang } = useLanguage()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart()
  const { user } = useAuth()
  const t = translations[lang]
  const [promoCode, setPromoCode] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const shippingCost = totalPrice >= 50 ? 0 : 4.99
  const finalTotal = totalPrice + shippingCost

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
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
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t.cart.title} ({totalItems} {t.cart.items})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex-shrink-0 w-20 h-20">
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
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {lang === 'de' ? item.name : item.nameEn}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {item.size && <span>{t.cart.size}: {item.size}</span>}
                          {item.color && <span>{t.cart.color}: {item.color}</span>}
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
                              disabled={item.quantity >= item.stock}
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
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t.cart.summary}
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.cart.promoCode}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={t.cart.promoPlaceholder}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    {t.cart.apply}
                  </button>
                </div>
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
                    {t.cart.freeShippingNote} {formatPrice(50)}
                  </p>
                )}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{t.cart.total}</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t.common.vatAmount}</span>
                    <span>{formatPrice(calculateVATFromGross(finalTotal).vatAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {t.common.vatIncluded}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="space-y-3">
                {user ? (
                  <Link
                    href="/checkout"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                  >
                    {t.cart.checkout}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login?redirect=/checkout"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
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
                
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors">
                  {t.cart.paypalExpress}
                </button>
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