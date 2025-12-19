'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { calculateVATFromGross } from '@/lib/vat'

interface ShippingAddress {
  firstName: string
  lastName: string
  company: string
  street: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
}

interface BillingAddress extends ShippingAddress {}

interface CardDetails {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}

type PaymentMethod = 'card' | 'paypal' | 'googlepay' | 'cod'

export default function Checkout() {
  const { lang } = useLanguage()
  const { items, totalPrice, totalItems, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    phone: '',
    email: user?.email || '',
  })

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    phone: '',
    email: '',
  })

  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout')
    }
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate shipping address
    if (!shippingAddress.firstName.trim()) {
      newErrors.firstName = t.checkout.errors.required
    }
    if (!shippingAddress.lastName.trim()) {
      newErrors.lastName = t.checkout.errors.required
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = t.checkout.errors.required
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = t.checkout.errors.required
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = t.checkout.errors.required
    } else if (!/^\d{5}$/.test(shippingAddress.postalCode)) {
      newErrors.postalCode = t.checkout.errors.invalidPostalCode
    }
    if (shippingAddress.country !== 'Deutschland') {
      newErrors.country = t.checkout.errors.onlyGermany
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = t.checkout.errors.required
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(shippingAddress.phone)) {
      newErrors.phone = t.checkout.errors.invalidPhone
    }
    if (!shippingAddress.email.trim()) {
      newErrors.email = t.checkout.errors.required
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = t.checkout.errors.invalidEmail
    }

    // Validate billing address if different
    if (!sameAsShipping) {
      if (!billingAddress.firstName.trim()) {
        newErrors.billingFirstName = t.checkout.errors.required
      }
      if (!billingAddress.lastName.trim()) {
        newErrors.billingLastName = t.checkout.errors.required
      }
      if (!billingAddress.street.trim()) {
        newErrors.billingStreet = t.checkout.errors.required
      }
      if (!billingAddress.city.trim()) {
        newErrors.billingCity = t.checkout.errors.required
      }
      if (!billingAddress.postalCode.trim()) {
        newErrors.billingPostalCode = t.checkout.errors.required
      } else if (!/^\d{5}$/.test(billingAddress.postalCode)) {
        newErrors.billingPostalCode = t.checkout.errors.invalidPostalCode
      }
      if (billingAddress.country !== 'Deutschland') {
        newErrors.billingCountry = t.checkout.errors.onlyGermany
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    // No validation needed for PayPal, Google Pay, or COD
    // PayPal and Google Pay handle their own validation
    setErrors({})
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      // Get session token
      const session = localStorage.getItem('attireburg_session')
      const token = session ? JSON.parse(session).token : null

      if (!token) {
        router.push('/login?redirect=/checkout')
        return
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          salePrice: item.salePrice,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        shippingAddress: sameAsShipping ? shippingAddress : shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod,
        totalAmount: finalTotal,
        shippingCost,
        tax: vatBreakdown.vatAmount,
        codFee,
      }

      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        setErrors({ general: orderResult.error || 'Fehler beim Aufgeben der Bestellung' })
        return
      }

      // Handle different payment methods
      if (paymentMethod === 'paypal') {
        // Create PayPal order
        const paypalResponse = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: finalTotal,
            currency: 'EUR',
            orderId: orderResult.orderId,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.salePrice || item.price
            })),
            shippingAddress
          }),
        })

        const paypalResult = await paypalResponse.json()

        if (paypalResponse.ok && paypalResult.approvalUrl) {
          // Store order ID for later use
          localStorage.setItem('pending_order_id', orderResult.orderId)
          localStorage.setItem('paypal_order_id', paypalResult.paypalOrderId)
          
          // Redirect to PayPal
          window.location.href = paypalResult.approvalUrl
          return
        } else {
          setErrors({ general: 'Fehler bei der PayPal-Integration' })
          return
        }
      } else if (paymentMethod === 'googlepay') {
        // Handle Google Pay
        try {
          // Check if Google Pay is available
          const { googlePayService } = await import('@/lib/googlepay')
          const isReady = await googlePayService.isReadyToPay()
          
          if (!isReady) {
            setErrors({ general: 'Google Pay ist nicht verfügbar' })
            return
          }

          // Request Google Pay payment
          const paymentData = await googlePayService.requestPayment({
            amount: finalTotal,
            currency: 'EUR',
            orderId: orderResult.orderId,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.salePrice || item.price
            }))
          })

          // Process the payment
          const processResponse = await fetch('/api/payments/googlepay/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentData,
              orderId: orderResult.orderId
            }),
          })

          const processResult = await processResponse.json()

          if (processResponse.ok && processResult.success) {
            clearCart()
            router.push(`/checkout/success?orderId=${orderResult.orderId}`)
          } else {
            setErrors({ general: 'Google Pay Zahlung fehlgeschlagen' })
          }
        } catch (error) {
          console.error('Google Pay error:', error)
          setErrors({ general: 'Google Pay Zahlung wurde abgebrochen' })
        }
      } else if (paymentMethod === 'cod') {
        // Cash on delivery - order is complete
        clearCart()
        router.push(`/checkout/success?orderId=${orderResult.orderId}`)
      } else {
        // Default case - should not reach here with current payment options
        setErrors({ general: 'Bitte wählen Sie eine gültige Zahlungsmethode' })
      }

    } catch (error) {
      console.error('Order placement error:', error)
      setErrors({ general: 'Fehler beim Aufgeben der Bestellung' })
    } finally {
      setLoading(false)
    }
  }

  const shippingCost = totalPrice >= 50 ? 0 : 4.99
  const codFee = paymentMethod === 'cod' ? 2.50 : 0
  const finalTotal = totalPrice + shippingCost + codFee
  const vatBreakdown = calculateVATFromGross(finalTotal)

  if (!user || items.length === 0) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t.checkout.title}
          </h1>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${
                  step <= currentStep ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step === 1 && t.checkout.step1}
                  {step === 2 && t.checkout.step2}
                  {step === 3 && t.checkout.step3}
                </span>
                {step < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.checkout.shippingAddress}
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.firstName} *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.firstName}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.lastName} *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.lastName}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.checkout.companyOptional}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.company}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.checkout.street} *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                        errors.street ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.city} *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.postalCode} *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12345"
                      />
                      {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.checkout.country} *
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                        errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="Deutschland">{t.common.germany}</option>
                    </select>
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                    <p className="text-sm text-gray-600 mt-1">{t.checkout.deliveryNote}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.phone} *
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+49 123 456789"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.checkout.email} *
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Billing Address Toggle */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sameAsShipping" className="ml-2 text-sm text-gray-900">
                        {t.checkout.sameAsShipping}
                      </label>
                    </div>

                    {!sameAsShipping && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t.checkout.billingAddress}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setBillingAddress({
                              firstName: shippingAddress.firstName,
                              lastName: shippingAddress.lastName,
                              company: shippingAddress.company,
                              street: shippingAddress.street,
                              city: shippingAddress.city,
                              postalCode: shippingAddress.postalCode,
                              country: shippingAddress.country,
                              phone: shippingAddress.phone,
                              email: shippingAddress.email,
                            })}
                            className="text-sm text-primary-600 hover:text-primary-700 underline"
                          >
                            Von Lieferadresse kopieren
                          </button>
                        </div>
                        
                        {/* Billing Address Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.firstName} *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.firstName}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                                errors.billingFirstName ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.billingFirstName && <p className="text-red-500 text-sm mt-1">{errors.billingFirstName}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.lastName} *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.lastName}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                                errors.billingLastName ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.billingLastName && <p className="text-red-500 text-sm mt-1">{errors.billingLastName}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.checkout.companyOptional}
                          </label>
                          <input
                            type="text"
                            value={billingAddress.company}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.checkout.street} *
                          </label>
                          <input
                            type="text"
                            value={billingAddress.street}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                              errors.billingStreet ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.billingStreet && <p className="text-red-500 text-sm mt-1">{errors.billingStreet}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.city} *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                                errors.billingCity ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.billingCity && <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.postalCode} *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.postalCode}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                                errors.billingPostalCode ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="12345"
                            />
                            {errors.billingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.billingPostalCode}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.checkout.country} *
                          </label>
                          <select
                            value={billingAddress.country}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                              errors.billingCountry ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="Deutschland">{t.common.germany}</option>
                          </select>
                          {errors.billingCountry && <p className="text-red-500 text-sm mt-1">{errors.billingCountry}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.phone}
                            </label>
                            <input
                              type="tel"
                              value={billingAddress.phone}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="+49 123 456789"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.checkout.email}
                            </label>
                            <input
                              type="email"
                              value={billingAddress.email}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.checkout.paymentMethod}
                </h2>

                <div className="space-y-4 mb-6">
                  {/* PayPal (includes cards) */}
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'paypal' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                  }`} onClick={() => setPaymentMethod('paypal')}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <label className="ml-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          PayPal & Kreditkarten
                        </span>
                        <div className="ml-2 flex space-x-1">
                          <div className="w-16 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">PayPal</div>
                          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">VISA</div>
                          <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center">MC</div>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-7">
                      Zahlen Sie mit PayPal-Konto oder Kreditkarte (ohne PayPal-Konto)
                    </p>
                  </div>



                  {/* Google Pay */}
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'googlepay' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                  }`} onClick={() => setPaymentMethod('googlepay')}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="googlepay"
                        checked={paymentMethod === 'googlepay'}
                        onChange={() => setPaymentMethod('googlepay')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <label className="ml-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {t.checkout.paymentMethods.googlepay}
                        </span>
                        <div className="ml-2 w-16 h-5 bg-gray-800 rounded text-white text-xs flex items-center justify-center">G Pay</div>
                      </label>
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                  }`} onClick={() => setPaymentMethod('cod')}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <label className="ml-3">
                        <span className="text-sm font-medium text-gray-900">
                          {t.checkout.paymentMethods.cod}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          {t.checkout.codNote}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Payment Method Info */}
                {paymentMethod === 'cod' && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        Zusätzliche Gebühr: {formatPrice(codFee)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.checkout.step3}
                </h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-gray-400 text-xs">{t.common.noImage}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {lang === 'de' ? item.name : item.nameEn}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {item.size && <span>Größe: {item.size}</span>}
                          {item.color && <span className="ml-4">Farbe: {item.color}</span>}
                          <span className="ml-4">Anzahl: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatPrice((item.salePrice || item.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Address Summary */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className={`grid ${!sameAsShipping ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                    {/* Shipping Address */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t.checkout.shippingAddress}
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        {shippingAddress.company && <p>{shippingAddress.company}</p>}
                        <p>{shippingAddress.street}</p>
                        <p>{shippingAddress.postalCode} {shippingAddress.city}</p>
                        <p>{shippingAddress.country}</p>
                        <p>{shippingAddress.phone}</p>
                        <p>{shippingAddress.email}</p>
                      </div>
                    </div>

                    {/* Billing Address (only show if different) */}
                    {!sameAsShipping && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {t.checkout.billingAddress}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>{billingAddress.firstName} {billingAddress.lastName}</p>
                          {billingAddress.company && <p>{billingAddress.company}</p>}
                          <p>{billingAddress.street}</p>
                          <p>{billingAddress.postalCode} {billingAddress.city}</p>
                          <p>{billingAddress.country}</p>
                          {billingAddress.phone && <p>{billingAddress.phone}</p>}
                          {billingAddress.email && <p>{billingAddress.email}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t.checkout.paymentMethod}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t.checkout.paymentMethods[paymentMethod]}
                    {paymentMethod === 'card' && cardDetails.cardNumber && (
                      <span className="ml-2">
                        **** **** **** {cardDetails.cardNumber.slice(-4)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-6">
                {errors.general}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <div>
                {currentStep > 1 ? (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.checkout.back}
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block"
                  >
                    {t.checkout.backToCart}
                  </Link>
                )}
              </div>

              <div>
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    {t.checkout.continue}
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
                  >
                    {loading ? t.checkout.processing : t.checkout.placeOrder}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t.checkout.orderSummary}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t.checkout.subtotal} ({totalItems} Artikel)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.checkout.shipping}</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Kostenlos</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Nachnahmegebühr</span>
                    <span>{formatPrice(codFee)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{t.checkout.total}</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t.common.vatAmount}</span>
                    <span>{formatPrice(vatBreakdown.vatAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {t.common.vatIncluded}
                  </p>
                </div>
              </div>

              {/* Security Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t.checkout.secureCheckout}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}