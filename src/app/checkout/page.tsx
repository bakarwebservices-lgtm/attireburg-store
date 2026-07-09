'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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

function CheckoutPage() {
  const searchParams = useSearchParams()
  const urlPayment = searchParams.get('payment')
  const urlToken = searchParams.get('token')
  const urlPayerId = searchParams.get('PayerID')

  const { lang } = useLanguage()
  const { items, totalPrice, totalItems, clearCart, appliedCoupon, discountedTotal } = useCart()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = translations[lang]
  const isDemoMode = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === 'demo' || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [outOfStockError, setOutOfStockError] = useState(false)
  const [paypalToken, setPaypalToken] = useState<string | null>(null)
  const [paypalPayerId, setPaypalPayerId] = useState<string | null>(null)
  const [siteSettings, setSiteSettings] = useState<{
    freeShippingThreshold: number
    standardShippingCost: number
    taxRate: number
  } | null>(null)
  const [isProcessingPayPalExpress, setIsProcessingPayPalExpress] = useState(false)
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false)

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal')
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  // Card payment states
  const [demoCardName, setDemoCardName] = useState('')
  const [demoCardNumber, setDemoCardNumber] = useState('')
  const [demoCardExpiry, setDemoCardExpiry] = useState('')
  const [demoCardCvv, setDemoCardCvv] = useState('')
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [paypalCardInstance, setPaypalCardInstance] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load site settings
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

  // Load default address / profile details once user is loaded
  useEffect(() => {
    if (user) {
      // 1. Check if there are saved addresses in localStorage for this user
      const stored = localStorage.getItem(`addresses_${user.id}`)
      if (stored) {
        try {
          const addresses = JSON.parse(stored)
          const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0]
          if (defaultAddr) {
            setShippingAddress({
              firstName: defaultAddr.firstName || user.firstName || '',
              lastName: defaultAddr.lastName || user.lastName || '',
              company: defaultAddr.company || '',
              street: defaultAddr.street || '',
              city: defaultAddr.city || '',
              postalCode: defaultAddr.postalCode || '',
              country: defaultAddr.country || 'Deutschland',
              phone: defaultAddr.phone || '',
              email: user.email || '',
            })
            return
          }
        } catch (e) {
          console.error('Failed to parse stored addresses:', e)
        }
      }

      // 2. Fallback to basic profile details if no saved addresses exist
      setShippingAddress(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        phone: prev.phone || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  // Redirect if cart is empty — but not while placing an order or after success navigation
  useEffect(() => {
    if (items.length === 0 && !loading && pathname === '/checkout') {
      router.push('/cart')
    }
  }, [items, router, loading, pathname])

  // Redirect if not authenticated — guests are allowed through
  // (no redirect needed for guest checkout)

  // Set initial payment method from query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const payment = params.get('payment')
      if (payment === 'paypal' || payment === 'googlepay' || payment === 'cod' || payment === 'card') {
        setPaymentMethod(payment as PaymentMethod)
      }
    }
  }, [])

  // Load PayPal SDK dynamically for Card Fields when 'card' payment method is selected
  useEffect(() => {
    const isDemo = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === 'demo' || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (paymentMethod !== 'card' || isDemo) return

    let active = true

    const loadScriptAndInitialize = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
        
        // Check if script is already present
        const scriptId = 'paypal-sdk-card-fields'
        let script = document.getElementById(scriptId) as HTMLScriptElement | null
        
        if (!script) {
          script = document.createElement('script')
          script.id = scriptId
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=card-fields&currency=EUR`
          script.async = true
          document.body.appendChild(script)
        }

        const onScriptLoad = () => {
          if (!active) return
          setScriptLoaded(true)
          
          const paypal = (window as any).paypal
          if (paypal && paypal.CardFields) {
            try {
              // Wait for fields to be in DOM
              setTimeout(() => {
                if (!active) return
                
                const session = localStorage.getItem('attireburg_session')
                const token = session ? JSON.parse(session).token : null

                const cardFields = paypal.CardFields({
                  style: {
                    input: {
                      'font-size': '14px',
                      'font-family': 'sans-serif',
                      'color': '#333333',
                    },
                  },
                  createOrder: async () => {
                    const orderData = {
                      items: items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId || null,
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
                      paymentMethod: 'card',
                      totalAmount: finalTotal,
                      shippingCost,
                      tax: vatBreakdown.vatAmount,
                      codFee,
                      couponCode: appliedCoupon?.code || null,
                      discountAmount: appliedCoupon?.discountAmount || 0,
                      guestEmail: !user ? (shippingAddress.email || '') : undefined,
                    }

                    const orderResponse = await fetch('/api/orders', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify(orderData),
                    })
                    const orderResult = await orderResponse.json()
                    if (!orderResponse.ok) {
                      throw new Error(orderResult.error || 'Failed to create order')
                    }

                    localStorage.setItem('pending_order_id', orderResult.orderId)

                    // Create PayPal order
                    const paypalResponse = await fetch('/api/payments/paypal/create-order', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
                    if (!paypalResponse.ok) {
                      throw new Error(paypalResult.error || 'Failed to create PayPal order')
                    }

                    return paypalResult.paypalOrderId
                  },
                  onApprove: async (data: any) => {
                    const pendingOrderId = localStorage.getItem('pending_order_id')

                    try {
                      const captureResponse = await fetch('/api/payments/paypal/capture-order', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          paypalOrderId: data.orderID,
                          orderId: pendingOrderId,
                          guestEmail: shippingAddress.email
                        }),
                      })

                      const captureResult = await captureResponse.json()
                      if (captureResponse.ok && captureResult.success) {
                        clearCart()
                        localStorage.removeItem('pending_order_id')
                        router.push(`/checkout/success?orderId=${pendingOrderId}`)
                      } else {
                        setErrors({ general: captureResult.error || 'Kartenzahlung konnte nicht erfasst werden.' })
                        setLoading(false)
                      }
                    } catch (captureErr) {
                      console.error('PayPal Card capture failed:', captureErr)
                      setErrors({ general: 'Fehler beim Erfassen der Kartenzahlung' })
                      setLoading(false)
                    }
                  },
                  onError: (err: any) => {
                    console.error('PayPal CardFields error:', err)
                    setErrors({ general: 'Kartenzahlung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.' })
                    setLoading(false)
                  }
                })

                if (cardFields.isEligible()) {
                  const numberField = cardFields.NumberField()
                  numberField.render('#card-number-field')

                  const expiryField = cardFields.ExpiryField()
                  expiryField.render('#card-expiry-field')

                  const cvvField = cardFields.CVVField()
                  cvvField.render('#card-cvv-field')

                  const nameField = cardFields.NameField()
                  nameField.render('#card-holder-name-field')

                  setPaypalCardInstance(cardFields)
                } else {
                  setSdkError('Kreditkartenzahlung über PayPal ist für dieses Land/Konto derzeit nicht verfügbar.')
                }
              }, 500)
            } catch (err) {
              console.error('CardFields init error:', err)
              setSdkError('Fehler beim Initialisieren der Kartenzahlung.')
            }
          }
        }

        if ((window as any).paypal && (window as any).paypal.CardFields) {
          onScriptLoad()
        } else {
          script.addEventListener('load', onScriptLoad)
        }
      } catch (err) {
        console.error('Failed to load PayPal SDK script:', err)
        setSdkError('Fehler beim Laden des Zahlungs-SDKs.')
      }
    }

    loadScriptAndInitialize()

    return () => {
      active = false
    }
  }, [paymentMethod])


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
      const session = localStorage.getItem('attireburg_session')
      const token = session ? JSON.parse(session).token : null
      // guests proceed without a token

      // If card payment is selected in REAL MODE, we trigger CardFields submission.
      // This will handle creating the order on the backend and capturing payment.
      if (paymentMethod === 'card' && !isDemoMode) {
        if (!paypalCardInstance) {
          setErrors({ general: 'Zahlungs-SDK wird geladen oder ist nicht verfügbar. Bitte laden Sie die Seite neu.' })
          setLoading(false)
          return
        }

        try {
          await paypalCardInstance.submit()
        } catch (err: any) {
          console.error('PayPal CardFields submit failed:', err)
          setErrors({ general: err.message || 'Kartenzahlung konnte nicht verarbeitet werden.' })
          setLoading(false)
        }
        return
      }

      // If we already have a paypalToken (meaning the customer returned from PayPal Express checkout),
      // we capture the payment immediately.
      if (paymentMethod === 'paypal' && paypalToken) {
        if (!token) {
          setErrors({ general: 'Für PayPal-Zahlung ist ein Konto erforderlich.' })
          setLoading(false)
          return
        }
        const pendingOrderId = localStorage.getItem('pending_order_id')
        
        if (!pendingOrderId) {
          setErrors({ general: 'Sitzung abgelaufen. Bitte wiederholen Sie den Bestellvorgang.' })
          setLoading(false)
          return
        }

        // Capture payment
        const response = await fetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            paypalOrderId: paypalToken,
            orderId: pendingOrderId
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          clearCart()
          localStorage.removeItem('pending_order_id')
          localStorage.removeItem('paypal_order_id')
          localStorage.removeItem('paypal_express_initiated')
          router.push(`/checkout/success?orderId=${pendingOrderId}`)
        } else {
          setErrors({ general: result.error || 'Zahlung konnte nicht abgeschlossen werden' })
        }
        setLoading(false)
        return
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || null,
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
        couponCode: appliedCoupon?.code || null,
        discountAmount: appliedCoupon?.discountAmount || 0,
        guestEmail: !user ? (shippingAddress.email || '') : undefined,
      }

      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderData),
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        if (orderResult.outOfStock) {
          setOutOfStockError(true)
          setLoading(false)
          return
        }
        setErrors({ general: orderResult.error || 'Fehler beim Aufgeben der Bestellung' })
        return
      }

      // Handle different payment methods
      if (paymentMethod === 'paypal') {
        // Check if we're in demo mode
        const isDemo = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === 'demo' || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
        
        if (isDemo) {
          // Demo mode - simulate successful payment
          clearCart()
          router.push(`/checkout/success?orderId=${orderResult.orderId}&demo=true`)
          return
        }

        // Create PayPal order (real mode)
        const paypalResponse = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
          if (!user) {
            localStorage.setItem('guest_order_email', shippingAddress.email || '')
          }
          
          // Redirect to PayPal
          window.location.href = paypalResult.approvalUrl
          return
        } else {
          setErrors({ general: paypalResult.error || 'Fehler bei der PayPal-Integration' })
          return
        }
      } else if (paymentMethod === 'googlepay') {
        // Check if we're in demo mode
        const isDemo = process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID === 'demo' || !process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID
        
        if (isDemo) {
          // Demo mode - simulate successful payment
          clearCart()
          router.push(`/checkout/success?orderId=${orderResult.orderId}&demo=true`)
          return
        }

        // Handle Google Pay (real mode)
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
        // Cash on delivery - navigate to success page
        // clearCart() is called by the success page after confirming the order
        router.push(`/checkout/success?orderId=${orderResult.orderId}&payment=cod`)
      } else if (paymentMethod === 'card') {
        // This block is only reached in Demo Mode (because Real Mode returned early)
        if (!demoCardName.trim() || !demoCardNumber.trim() || !demoCardExpiry.trim() || !demoCardCvv.trim()) {
          setErrors({ general: 'Bitte füllen Sie alle Kreditkartendaten aus.' })
          setLoading(false)
          return
        }
        clearCart()
        router.push(`/checkout/success?orderId=${orderResult.orderId}&demo=true&payment=card`)
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

  const handlePayPalExpress = async () => {
    setLoading(true)
    setErrors({})
    try {
      const session = localStorage.getItem('attireburg_session')
      const token = session ? JSON.parse(session).token : null

      if (!token) {
        // PayPal Express requires an account for the ownership check on PayPal session creation
        setErrors({ general: 'Für PayPal Express ist ein Konto erforderlich. Bitte melden Sie sich an oder nutzen Sie den regulären Checkout.' })
        setLoading(false)
        return
      }

      // Load settings dynamically inside the function to ensure we have the latest values
      let currentSettings = {
        freeShippingThreshold: 50,
        standardShippingCost: 4.99,
        taxRate: 19
      }
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          if (data && !data.error) {
            currentSettings = data
          }
        }
      } catch (err) {
        console.error('Failed to load settings in handlePayPalExpress:', err)
      }

      const dummyAddress = {
        firstName: user?.firstName || 'PayPal',
        lastName: user?.lastName || 'Express',
        company: '',
        street: 'PayPal-Strasse 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Deutschland',
        phone: '015112345678',
        email: user?.email || 'paypal-kunde@attireburg.de'
      }

      // Update local state
      setShippingAddress(dummyAddress)

      const computedDiscount = appliedCoupon?.discountAmount || 0
      const computedDiscountedSubtotal = Math.max(0, totalPrice - computedDiscount)
      const computedShipping = computedDiscountedSubtotal >= currentSettings.freeShippingThreshold ? 0 : currentSettings.standardShippingCost
      const computedCodFee = 0 // PayPal Express never has COD fee
      const computedTotal = computedDiscountedSubtotal + computedShipping + computedCodFee
      const computedVat = calculateVATFromGross(computedTotal, currentSettings.taxRate)

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || null,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          salePrice: item.salePrice,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        shippingAddress: dummyAddress,
        billingAddress: dummyAddress,
        paymentMethod: 'paypal',
        totalAmount: computedTotal,
        shippingCost: computedShipping,
        tax: computedVat.vatAmount,
        codFee: computedCodFee,
        couponCode: appliedCoupon?.code || null,
        discountAmount: computedDiscount,
      }

      // Create Prisma order
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
        if (orderResult.outOfStock) {
          setOutOfStockError(true)
          setLoading(false)
          return
        }
        setErrors({ general: orderResult.error || 'Fehler beim Erstellen der Bestellung' })
        setLoading(false)
        return
      }

      // Redirect to PayPal
      const isDemo = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === 'demo' || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      
      if (isDemo) {
        clearCart()
        router.push(`/checkout/success?orderId=${orderResult.orderId}&demo=true`)
        return
      }

      const paypalResponse = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: computedTotal,
          currency: 'EUR',
          orderId: orderResult.orderId,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.salePrice || item.price
          })),
          shippingAddress: dummyAddress
        }),
      })

      const paypalResult = await paypalResponse.json()

      if (paypalResponse.ok && paypalResult.approvalUrl) {
        localStorage.setItem('pending_order_id', orderResult.orderId)
        localStorage.setItem('paypal_order_id', paypalResult.paypalOrderId)
        localStorage.setItem('paypal_express_initiated', 'true')
        
        // Remove query parameters from history state so browser Back button won't trigger redirect loop
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/checkout')
        }
        
        window.location.href = paypalResult.approvalUrl
        return
      } else {
        setErrors({ general: paypalResult.error || 'Fehler bei der PayPal-Integration' })
      }

    } catch (error) {
      console.error('PayPal Express Checkout failed:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.' })
    } finally {
      setLoading(false)
    }
  }

  // Check URL parameters for PayPal Return
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSiteSettings(data)
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err))

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tokenParam = params.get('token')
      const payerIdParam = params.get('PayerID')
      const expressInitiated = localStorage.getItem('paypal_express_initiated') === 'true'

      if (tokenParam && payerIdParam) {
        // Clear flag since they completed PayPal checkout auth successfully
        localStorage.removeItem('paypal_express_initiated')
        
        setPaypalToken(tokenParam)
        setPaypalPayerId(payerIdParam)
        setPaymentMethod('paypal')
        
        // Fetch shipping address from PayPal
        const fetchPayPalAddress = async () => {
          setIsProcessingPayPalExpress(true)
          try {
            const session = localStorage.getItem('attireburg_session')
            const authToken = session ? JSON.parse(session).token : null
            if (!authToken) return

            const response = await fetch(`/api/payments/paypal/get-order?paypalOrderId=${tokenParam}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })
            const data = await response.ok ? await response.json() : null
            if (data && data.success && data.shippingAddress) {
              setShippingAddress(data.shippingAddress)
              // Go directly to step 3 (Review Order)
              setCurrentStep(3)
            } else {
              setErrors({ general: 'PayPal-Zahlungsadresse konnte nicht abgerufen werden.' })
            }
          } catch (err) {
            console.error('Error fetching PayPal details:', err)
            setErrors({ general: 'Fehler beim Laden der PayPal-Daten' })
          } finally {
            setIsProcessingPayPalExpress(false)
          }
        }
        fetchPayPalAddress()
      } else if (expressInitiated) {
        // Customer returned/clicked back/cancelled PayPal checkout
        localStorage.removeItem('paypal_express_initiated')
        localStorage.removeItem('pending_order_id')
        localStorage.removeItem('paypal_order_id')
        router.push('/cart?payment_cancelled=true')
      } else {
        // Handle direct auto-redirect if ?payment=paypal is passed in URL on first checkout load
        const payment = params.get('payment')
        if (payment === 'paypal') {
          setIsAutoRedirecting(true)
          setTimeout(async () => {
            await handlePayPalExpress()
            setIsAutoRedirecting(false)
          }, 300)
        }
      }
    }
  }, [])

  const settings = siteSettings || {
    freeShippingThreshold: 50,
    standardShippingCost: 4.99,
    taxRate: 19
  }

  const shippingCost = discountedTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingCost
  const codFee = paymentMethod === 'cod' ? 2.50 : 0
  const finalTotal = discountedTotal + shippingCost + codFee
  const vatBreakdown = calculateVATFromGross(finalTotal, settings.taxRate)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (items.length === 0 && !loading && pathname === '/checkout') {
    return null // Will redirect to cart
  }

  if (isProcessingPayPalExpress || isAutoRedirecting || (loading && currentStep === 1 && paymentMethod === 'paypal')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {isProcessingPayPalExpress || urlToken
              ? 'Zahlungs- und Versanddetails werden von PayPal geladen...'
              : 'Sie werden zu PayPal weitergeleitet...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      {/* Out-of-stock modal */}
      {outOfStockError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {lang === 'de' ? 'Leider ausverkauft' : 'Sorry, out of stock'}
            </h2>
            <p className="text-gray-600 mb-6">
              {lang === 'de'
                ? 'Während du bestellt hast, wurde ein Artikel in deinem Warenkorb von jemand anderem gekauft. Wir benachrichtigen dich, sobald er wieder verfügbar ist.'
                : 'While you were checking out, an item in your cart was purchased by someone else. We\'ll notify you as soon as it\'s back in stock.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/products"
                onClick={() => setOutOfStockError(false)}
                className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {lang === 'de' ? 'Zur Warteliste anmelden' : 'Join the waitlist'}
              </Link>
              <button
                onClick={() => { setOutOfStockError(false) }}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {lang === 'de' ? 'Zurück zum Warenkorb' : 'Back to cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {t.checkout.title}
          </h1>
          
          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  step <= currentStep
                    ? 'bg-brand-800 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                <span className={`ml-2 text-xs sm:text-sm hidden sm:block ${
                  step <= currentStep ? 'text-brand-800 font-medium' : 'text-gray-400'
                }`}>
                  {step === 1 && t.checkout.step1}
                  {step === 2 && t.checkout.step2}
                  {step === 3 && t.checkout.step3}
                </span>
                {step < 3 && <div className="flex-1 h-px bg-gray-300 mx-2 sm:mx-4 w-6 sm:w-12" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            <div className={currentStep === 1 ? '' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
            </div>

            {/* Step 2: Payment Method */}
            <div className={currentStep === 2 ? '' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.checkout.paymentMethod}
                </h2>

                <div className="space-y-4 mb-6">
                  {/* PayPal */}
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
                          {lang === 'de' ? 'PayPal & Kreditkarten' : 'PayPal & Credit Cards'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-7">
                      {lang === 'de' 
                        ? 'Zahlen Sie sicher und schnell mit Ihrem PayPal-Konto oder mit Ihrer Kreditkarte.' 
                        : 'Pay safely and quickly with your PayPal account or credit card.'}
                    </p>
                  </div>

                  {/* Credit / Debit Card via PayPal Hosted Fields */}
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'card' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                  }`} onClick={() => setPaymentMethod('card')}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <label className="ml-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {lang === 'de' ? 'Kredit- oder Debitkarte' : 'Credit or Debit Card'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-7">
                      {lang === 'de' 
                        ? 'Zahlen Sie direkt und sicher mit Ihrer Visa, Mastercard oder anderen gängigen Karten.' 
                        : 'Pay directly and securely with your Visa, Mastercard, or other major cards.'}
                    </p>

                    {/* Card Fields inputs (will render only if paymentMethod === 'card') */}
                    {paymentMethod === 'card' && (
                      <div className="mt-4 border-t border-gray-200 pt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div id="card-fields-container" className="space-y-4">
                          {isDemoMode ? (
                            // Demo Mode card input fields
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  {lang === 'de' ? 'Name auf der Karte' : 'Cardholder Name'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="John Doe"
                                  value={demoCardName}
                                  onChange={(e) => setDemoCardName(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  {lang === 'de' ? 'Kartennummer' : 'Card Number'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="4111 1111 1111 1111"
                                  value={demoCardNumber}
                                  onChange={(e) => setDemoCardNumber(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600 text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    {lang === 'de' ? 'Ablaufdatum' : 'Expiry Date'}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="12/29"
                                    value={demoCardExpiry}
                                    onChange={(e) => setDemoCardExpiry(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    CVV
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="123"
                                    value={demoCardCvv}
                                    onChange={(e) => setDemoCardCvv(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Real mode card input fields (containers for PayPal JS SDK iFrames)
                            <div className="space-y-3">
                              {sdkError && (
                                <p className="text-red-500 text-xs mb-2">{sdkError}</p>
                              )}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  {lang === 'de' ? 'Name auf der Karte' : 'Cardholder Name'}
                                </label>
                                <div id="card-holder-name-field" className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  {lang === 'de' ? 'Kartennummer' : 'Card Number'}
                                </label>
                                <div id="card-number-field" className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    {lang === 'de' ? 'Ablaufdatum' : 'Expiry Date'}
                                  </label>
                                  <div id="card-expiry-field" className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    CVV
                                  </label>
                                  <div id="card-cvv-field" className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
            </div>

            {/* Step 3: Review Order */}
            <div className={currentStep === 3 ? '' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
            </div>

            {/* Error Display */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-6">
                {errors.general}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
              <div>
                {currentStep > 1 ? (
                  <button
                    onClick={handleBack}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.checkout.back}
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center"
                  >
                    {t.checkout.backToCart}
                  </Link>
                )}
              </div>

              <div>
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-800 hover:bg-brand-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    {t.checkout.continue}
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                  >
                    {loading ? t.checkout.processing : t.checkout.placeOrder}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t.checkout.orderSummary}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t.checkout.subtotal} ({totalItems} Artikel)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-700">
                    <span>
                      Rabatt ({appliedCoupon.code})
                      {appliedCoupon.discountType === 'percentage'
                        ? ` -${appliedCoupon.discountValue}%`
                        : ''}
                    </span>
                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
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
                    {t.common.vatIncluded.replace('19', settings.taxRate.toString())}
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

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Laden...</p>
        </div>
      </div>
    }>
      <CheckoutPage />
    </Suspense>
  )
}
