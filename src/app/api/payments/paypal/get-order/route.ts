import { NextRequest, NextResponse } from 'next/server'
import { paypalService } from '@/lib/paypal'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paypalOrderId = searchParams.get('paypalOrderId')

    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal Order ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Get access token for PayPal
    const accessToken = await paypalService.getAccessToken()

    // Fetch order details from PayPal
    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Failed to fetch PayPal order details:', errText)
      return NextResponse.json(
        { error: 'PayPal-Bestellung konnte nicht geladen werden' },
        { status: 400 }
      )
    }

    const paypalOrder = await response.json()

    // Parse shipping address
    const purchaseUnit = paypalOrder.purchase_units?.[0]
    const shipping = purchaseUnit?.shipping
    const address = shipping?.address
    const name = shipping?.name?.full_name || ''
    
    let parsedAddress = null
    if (address) {
      const street = address.address_line_1 + (address.address_line_2 ? ' ' + address.address_line_2 : '')
      const city = address.admin_area_2 || ''
      const postalCode = address.postal_code || ''
      const countryCode = address.country_code || 'DE'
      const country = countryCode === 'DE' ? 'Deutschland' : countryCode

      const nameParts = name.split(' ')
      const firstName = nameParts[0] || 'PayPal'
      const lastName = nameParts.slice(1).join(' ') || 'Kunde'

      parsedAddress = {
        firstName,
        lastName,
        company: '',
        street,
        city,
        postalCode,
        country,
        phone: '0000000000', // PayPal doesn't always return phone unless configured
        email: paypalOrder.payer?.email_address || ''
      }
    }

    return NextResponse.json({
      success: true,
      shippingAddress: parsedAddress
    })

  } catch (error) {
    console.error('Get PayPal order error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der PayPal-Bestellinformationen' },
      { status: 500 }
    )
  }
}
