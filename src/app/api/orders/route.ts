import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { inventoryService } from '@/lib/inventory'
import { emailService } from '@/lib/email/EmailService'
import { errorLogger } from '@/lib/logging/ErrorLogger'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      )
    }

    try {
      // Get user's orders
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  nameEn: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ orders })
    } catch (dbError) {
      errorLogger.logDatabaseError('fetch', 'orders', dbError as Error, { userId: user.id })
      console.log('Database not available, returning empty orders')
      return NextResponse.json({ orders: [] })
    }
  } catch (error) {
    errorLogger.logAPIError('/api/orders', 'GET', error as Error)
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bestellungen' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth is optional — support both authenticated users and guests
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      totalAmount,
      shippingCost,
      tax,
      codFee,
      couponCode,
      discountAmount,
      guestEmail,
    } = await request.json()

    // Validate required fields
    if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      )
    }

    // Validate Germany-only delivery
    if (shippingAddress.country !== 'Deutschland') {
      return NextResponse.json(
        { error: 'Lieferung nur nach Deutschland möglich' },
        { status: 400 }
      )
    }

    // Resolve userId — use authenticated user or fall back to a shared guest account
    let userId: string
    if (user) {
      userId = user.id
    } else {
      // Upsert a single shared guest user record for guest orders
      const startGuestUpsert = Date.now()
      const guestUser = await prisma.user.upsert({
        where: { email: 'guest@attireburg.internal' },
        update: {},
        create: {
          email: 'guest@attireburg.internal',
          name: 'Guest',
          password: 'GUEST_ACCOUNT_NO_LOGIN',
          isActive: false, // cannot log in
        },
        select: { id: true }
      })
      console.log(`[PERF] Guest user upsert took: ${Date.now() - startGuestUpsert}ms`)
      userId = guestUser.id
    }

    // Contact email: prefer authenticated user's shipping email, else guestEmail param
    const contactEmail = shippingAddress.email || guestEmail || ''

    try {
      // Pre-check stock availability before touching the database
      const inventoryItems = items
        .filter((item: any) => !item.isBackorder)
        .map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity
        }))

      if (inventoryItems.length > 0) {
        const startStockCheck = Date.now()
        const stockInfo = await inventoryService.checkStock(inventoryItems)
        console.log(`[PERF] inventoryService.checkStock took: ${Date.now() - startStockCheck}ms`)
        const unavailable = stockInfo.filter(s => !s.available)
        if (unavailable.length > 0) {
          return NextResponse.json(
            {
              error: 'Nicht genügend Lagerbestand verfügbar',
              outOfStock: true,
              unavailableItems: unavailable.map(s => ({
                productId: s.productId,
                variantId: s.variantId,
                available: s.currentStock
              }))
            },
            { status: 409 }
          )
        }
      }

      // Atomically create order AND decrement stock in one transaction
      const startDBTransaction = Date.now()
      const order = await prisma.$transaction(async (tx) => {
        // Re-check and decrement stock atomically for non-backorder items
        for (const item of inventoryItems) {
          if (item.variantId) {
            const startVarFind = Date.now()
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { stock: true, isActive: true }
            })
            console.log(`[PERF] tx.productVariant.findUnique query took: ${Date.now() - startVarFind}ms`)

            const startProdFind = Date.now()
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, isActive: true }
            })
            console.log(`[PERF] tx.product.findUnique query took: ${Date.now() - startProdFind}ms`)

            const combinedStock = variant?.stock || 0
            if (!variant?.isActive || !product?.isActive || combinedStock < item.quantity) {
              throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${combinedStock}`)
            }
            const startVarUpdate = Date.now()
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } }
            })
            console.log(`[PERF] tx.productVariant.update query took: ${Date.now() - startVarUpdate}ms`)

            const startProdUpdate = Date.now()
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            })
            console.log(`[PERF] tx.product.update query took: ${Date.now() - startProdUpdate}ms`)
          } else {
            const startProdFind = Date.now()
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, isActive: true }
            })
            console.log(`[PERF] tx.product.findUnique (no-variant) query took: ${Date.now() - startProdFind}ms`)

            if (!product?.isActive || (product?.stock || 0) < item.quantity) {
              throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${product?.stock || 0}`)
            }
            const startProdUpdate = Date.now()
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            })
            console.log(`[PERF] tx.product.update (no-variant) query took: ${Date.now() - startProdUpdate}ms`)
          }
        }

        // Create order record inside the same transaction
        const startOrderCreate = Date.now()
        const orderResult = await tx.order.create({
          data: {
            userId: userId,
            status: 'PENDING',
            totalAmount: totalAmount,
            currency: 'EUR',
            paymentMethod: paymentMethod,
            shippingAddress: `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.company ? shippingAddress.company + '\n' : ''}${shippingAddress.street}\n${shippingAddress.postalCode} ${shippingAddress.city}\n${shippingAddress.country}`,
            shippingCity: shippingAddress.city,
            shippingPostal: shippingAddress.postalCode,
            couponCode: couponCode || null,
            discountAmount: discountAmount || 0,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                size: item.size || '',
                color: item.color || null,
                price: item.salePrice || item.price,
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        })
        console.log(`[PERF] tx.order.create query took: ${Date.now() - startOrderCreate}ms`)
        return orderResult
      }).catch((txError: Error) => {
        if (txError.message.startsWith('INSUFFICIENT_STOCK:')) {
          const [, productId, available] = txError.message.split(':')
          const err = new Error('INSUFFICIENT_STOCK') as any
          err.productId = productId
          err.available = parseInt(available)
          throw err
        }
        throw txError
      })
      console.log(`[PERF] Prisma DB transaction overall took: ${Date.now() - startDBTransaction}ms`)

      // Here you would integrate with payment processors
      // For now, we'll simulate successful payment processing
      
      // Send order confirmation email in the background (non-blocking)
      const emailData = {
        orderNumber: `ATB-${order.id.slice(-6).toUpperCase()}`,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: contactEmail,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.salePrice || item.price,
          size: item.size,
          color: item.color
        })),
        totalAmount: totalAmount,  // already the gross final total
        shippingAddress: `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.company ? shippingAddress.company + '\n' : ''}${shippingAddress.street}\n${shippingAddress.postalCode} ${shippingAddress.city}\n${shippingAddress.country}`,
        paymentMethod: paymentMethod === 'cod' ? 'Nachnahme' : paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay',
        estimatedDelivery: '2-3 Werktage',
        couponCode: order.couponCode,
        discountAmount: order.discountAmount
      }

      if (paymentMethod !== 'paypal' && paymentMethod !== 'card') {
        if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
          try {
            await emailService.sendOrderConfirmation(emailData)
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError)
          }
        } else {
          emailService.sendOrderConfirmation(emailData).catch((emailError) => {
            errorLogger.error('Failed to send order confirmation email in background', { 
              orderId: order.id,
              customerEmail: shippingAddress.email 
            }, emailError as Error)
            console.error('Failed to send order confirmation email in background:', emailError)
          })
        }
      }
      
      return NextResponse.json({
        orderId: order.id,
        orderNumber: `ATB-${order.id.slice(-6).toUpperCase()}`,
        status: 'success',
        message: 'Bestellung erfolgreich aufgegeben'
      })
    } catch (dbError: any) {
      if (dbError.message === 'INSUFFICIENT_STOCK') {
        return NextResponse.json(
          {
            error: 'Nicht genügend Lagerbestand verfügbar',
            outOfStock: true,
            unavailableItems: [{ productId: dbError.productId, available: dbError.available }]
          },
          { status: 409 }
        )
      }
      errorLogger.logDatabaseError('create', 'orders', dbError as Error, { 
        userId: userId,
        itemCount: items.length,
        totalAmount 
      })
      console.log('Database not available, simulating order creation')
      
      // Simulate order creation when database is not available
      const mockOrderId = Date.now().toString()
      
      return NextResponse.json({
        orderId: mockOrderId,
        orderNumber: `ATB-${mockOrderId.slice(-6)}`,
        status: 'success',
        message: 'Bestellung erfolgreich aufgegeben'
      })
    }
  } catch (error) {
    const errorContext: Record<string, any> = {}
    
    try {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      if (token) {
        const userFromToken = verifyToken(token)
        if (userFromToken) errorContext.userId = userFromToken.id
      }
    } catch {}
    
    try {
      const body = await request.json()
      if (body.items) errorContext.itemCount = body.items.length
      if (body.paymentMethod) errorContext.paymentMethod = body.paymentMethod
    } catch {}

    errorLogger.logAPIError('/api/orders', 'POST', error as Error, errorContext)
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Bestellung' },
      { status: 500 }
    )
  }
}