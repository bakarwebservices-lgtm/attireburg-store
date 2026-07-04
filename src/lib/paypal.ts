// PayPal integration service
interface PayPalConfig {
  clientId: string
  clientSecret: string
  environment: 'sandbox' | 'production'
}

interface PayPalOrderRequest {
  amount: number
  currency: string
  orderId: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  shippingAddress?: {
    firstName: string
    lastName: string
    street: string
    city: string
    postalCode: string
    country: string
  }
}

interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

class PayPalService {
  private config: PayPalConfig
  private baseURL: string

  constructor() {
    this.config = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    }
    
    this.baseURL = this.config.environment === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'
  }

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PayPal OAuth failed:', errorText)
      throw new Error('Failed to get PayPal access token')
    }

    const data = await response.json()
    return data.access_token
  }

  async createOrder(orderRequest: PayPalOrderRequest): Promise<PayPalOrderResponse> {
    const accessToken = await this.getAccessToken()

    // PayPal requires exact decimal math — item_total + shipping MUST equal amount exactly
    const totalAmount = parseFloat(orderRequest.amount.toFixed(2))
    
    // Recalculate item total from individual items to avoid float drift
    const itemTotalRaw = orderRequest.items.reduce((sum, item) => {
      return sum + parseFloat((item.price * item.quantity).toFixed(2))
    }, 0)
    const itemTotal = parseFloat(itemTotalRaw.toFixed(2))
    
    // Shipping is whatever is left after items — could be 0 if discount made items > total
    const shippingRaw = totalAmount - itemTotal
    const shippingTotal = parseFloat(Math.max(0, shippingRaw).toFixed(2))
    
    // If items + shipping don't exactly match due to rounding, adjust shipping to compensate
    const breakdown_total = parseFloat((itemTotal + shippingTotal).toFixed(2))
    const adjustedShipping = parseFloat((shippingTotal + (totalAmount - breakdown_total)).toFixed(2))

    const paypalOrder: any = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderRequest.orderId,
        amount: {
          currency_code: orderRequest.currency,
          value: orderRequest.amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: orderRequest.currency,
              value: itemTotal.toFixed(2)
            },
            shipping: {
              currency_code: orderRequest.currency,
              value: adjustedShipping.toFixed(2)
            }
          }
        },
        items: orderRequest.items.map(item => ({
          name: item.name.substring(0, 127), // PayPal max 127 chars
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: orderRequest.currency,
            value: parseFloat(item.price.toFixed(2)).toFixed(2)
          }
        }))
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'UNRESTRICTED', // Allows both PayPal and cards
            brand_name: 'Attireburg',
            locale: 'de-DE',
            landing_page: 'LOGIN',
            shipping_preference: 'GET_FROM_FILE', // Let customer pick/specify address in PayPal Express
            user_action: 'PAY_NOW',
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?payment_cancelled=true`
          }
        }
      }
    }

    // Include shipping address if provided
    if (orderRequest.shippingAddress) {
      paypalOrder.purchase_units[0].shipping = {
        name: {
          full_name: `${orderRequest.shippingAddress.firstName} ${orderRequest.shippingAddress.lastName}`
        },
        address: {
          address_line_1: orderRequest.shippingAddress.street,
          admin_area_2: orderRequest.shippingAddress.city,
          postal_code: orderRequest.shippingAddress.postalCode,
          country_code: orderRequest.shippingAddress.country === 'Deutschland' ? 'DE' : 'DE'
        }
      }
    }

    const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paypalOrder)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal order creation failed:', JSON.stringify(error, null, 2))
      throw new Error(`PayPal error: ${error.message || error.name || JSON.stringify(error)}`)
    }

    return await response.json()
  }

  async captureOrder(paypalOrderId: string): Promise<any> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseURL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal order capture failed:', error)
      throw new Error('Failed to capture PayPal order')
    }

    return await response.json()
  }

  async verifyWebhook(headers: Record<string, string>, body: string): Promise<boolean> {
    // Implement webhook verification for production
    // For now, return true for development
    return true
  }
}

export const paypalService = new PayPalService()
export type { PayPalOrderRequest, PayPalOrderResponse }