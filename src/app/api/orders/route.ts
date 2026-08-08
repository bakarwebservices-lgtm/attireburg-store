import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { inventoryService, InventoryItem } from '@/lib/inventory'
import { emailService } from '@/lib/email/EmailService'
import { errorLogger } from '@/lib/logging/ErrorLogger'

export const dynamic = 'force-dynamic'

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
  const startPreTransaction = Date.now()
  console.time('[PERF] Pre-transaction steps')

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
      checkoutId,
    } = await request.json()

    // Validate required fields
    if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
      console.timeEnd('[PERF] Pre-transaction steps')
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      )
    }

    // Validate Germany-only delivery
    if (shippingAddress.country !== 'Deutschland') {
      console.timeEnd('[PERF] Pre-transaction steps')
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
        const stockInfo = await inventoryService.checkStock(inventoryItems, checkoutId)
        console.log(`[PERF] inventoryService.checkStock took: ${Date.now() - startStockCheck}ms`)
        const unavailable = stockInfo.filter(s => !s.available)
        if (unavailable.length > 0) {
          console.timeEnd('[PERF] Pre-transaction steps')
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

      // ─── PRE-TRANSACTION PHASE ──────────────────────────────────────────────
      // Fix: Move all aggregate queries OUTSIDE the $transaction to avoid
      // Supabase/PgBouncer interactive-transaction failures on the second pool.
      // The aggregate snapshot is used for the pre-validation check only.
      // The real-time atomic guard is the conditional updateMany inside the tx.
      //
      // TOCTOU note: there is an accepted window between pre-fetch and the tx
      // write where a competing checkout could consume stock. The conditional
      // updateMany (stock >= N) below is the write-time guard that prevents
      // actual oversell within that window.
      // TODO (tracked follow-up): replace with SELECT FOR UPDATE row-locking
      // once order volume warrants the added complexity.

      // Step 1: Batch-resolve variantId → blankGarmentId for all pool-linked items
      const variantItemsWithId = inventoryItems.filter((i: InventoryItem) => i.variantId)
      const resolvedVariants = variantItemsWithId.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantItemsWithId.map((i: InventoryItem) => i.variantId!) } },
            select: { id: true, blankGarmentId: true, isActive: true, stock: true }
          })
        : []

      // variantId → blankGarmentId lookup
      const variantBlankGarmentMap = new Map<string, string | null>(
        resolvedVariants.map(v => [v.id, v.blankGarmentId])
      )

      // Step 2: Compute per-pool TOTAL quantity needed across all cart items
      // (handles case where multiple products share the same blankGarmentId)
      const poolQuantityMap = new Map<string, number>() // blankGarmentId → total qty
      for (const item of inventoryItems) {
        if (!item.variantId) continue
        const bgId = variantBlankGarmentMap.get(item.variantId)
        if (!bgId) continue
        poolQuantityMap.set(bgId, (poolQuantityMap.get(bgId) ?? 0) + item.quantity)
      }

      // Step 3: Pre-fetch reservation aggregates for all relevant pools (OUTSIDE tx)
      const poolReservationAggMap = new Map<string, number>() // blankGarmentId → reserved qty
      if (poolQuantityMap.size > 0) {
        const startPoolAgg = Date.now()
        const aggResults = await Promise.all(
          Array.from(poolQuantityMap.keys()).map(poolId =>
            prisma.poolReservation.aggregate({
              where: {
                blankGarmentId: poolId,
                expiresAt: { gt: new Date() },
                ...(checkoutId ? { checkoutId: { not: checkoutId } } : {})
              },
              _sum: { quantity: true }
            }).then(r => ({ poolId, reserved: r._sum.quantity ?? 0 }))
          )
        )
        for (const { poolId, reserved } of aggResults) {
          poolReservationAggMap.set(poolId, reserved)
        }
        console.log(`[PERF] Pre-fetch pool reservation aggregates took: ${Date.now() - startPoolAgg}ms`)
      }

      console.log(`[PERF] Pre-transaction steps took: ${Date.now() - startPreTransaction}ms`)
      console.timeEnd('[PERF] Pre-transaction steps')

      // ─── TRANSACTION PHASE ─────────────────────────────────────────────────
      const startDBTransaction = Date.now()
      const order = await prisma.$transaction(
        async (tx) => {

        // --- PASS 1: Pool-linked items — one atomic decrement per unique pool ---
        // Processes each distinct BlankGarment pool exactly once, regardless of
        // how many cart items map to it. Uses pre-fetched aggregate for the
        // pre-validation, then a conditional updateMany for the actual write.
        for (const [poolId, totalQtyNeeded] of poolQuantityMap) {
          const startPoolRead = Date.now()
          const pool = await tx.blankGarment.findUnique({
            where: { id: poolId },
            select: { stock: true, isActive: true }
          })
          console.log(`[PERF] tx.blankGarment.findUnique took: ${Date.now() - startPoolRead}ms`)

          if (!pool || !pool.isActive) {
            // Find a productId for a useful error message
            const repItem = inventoryItems.find(
              (i: InventoryItem) => variantBlankGarmentMap.get(i.variantId ?? '') === poolId
            )
            throw new Error(`POOL_INACTIVE:${repItem?.productId ?? poolId}:0`)
          }

          const preloadedReserved = poolReservationAggMap.get(poolId) ?? 0
          const availableStock = pool.stock - preloadedReserved

          if (availableStock < totalQtyNeeded) {
            const repItem = inventoryItems.find(
              (i: InventoryItem) => variantBlankGarmentMap.get(i.variantId ?? '') === poolId
            )
            throw new Error(`INSUFFICIENT_STOCK:${repItem?.productId ?? poolId}:${availableStock}`)
          }

          // Conditional atomic write: UPDATE WHERE stock >= totalQtyNeeded.
          // This is the real-time oversell guard — independent of the pre-fetched
          // aggregate. If a concurrent transaction consumed stock between the
          // aggregate pre-fetch and this write, updateMany returns count=0 and we
          // abort. Generates: UPDATE "BlankGarment" SET stock = stock - N
          //                    WHERE id = ? AND stock >= N
          const startPoolWrite = Date.now()
          const updateResult = await tx.blankGarment.updateMany({
            where: { id: poolId, stock: { gte: totalQtyNeeded } },
            data: { stock: { decrement: totalQtyNeeded } }
          })
          console.log(`[PERF] tx.blankGarment.updateMany took: ${Date.now() - startPoolWrite}ms`)

          if (updateResult.count === 0) {
            // Stock was insufficient at actual write time (real-time oversell guard triggered)
            const repItem = inventoryItems.find(
              (i: InventoryItem) => variantBlankGarmentMap.get(i.variantId ?? '') === poolId
            )
            console.error(`[ORDER FAIL] Pool ${poolId} updateMany count=0 — real-time stock guard triggered`)
            throw new Error(`INSUFFICIENT_STOCK:${repItem?.productId ?? poolId}:0`)
          }

          // Clean up the soft-hold reservation for this checkout session
          if (checkoutId) {
            await tx.poolReservation.deleteMany({
              where: { checkoutId, blankGarmentId: poolId }
            })
          }
        }

        // --- PASS 2: All cart items — validate active status + product-level stock ---
        for (const item of inventoryItems) {
          if (item.variantId) {
            const bgId = variantBlankGarmentMap.get(item.variantId)
            const resolvedVariant = resolvedVariants.find(v => v.id === item.variantId)

            const startProdFind = Date.now()
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, isActive: true }
            })
            console.log(`[PERF] tx.product.findUnique query took: ${Date.now() - startProdFind}ms`)

            if (!resolvedVariant?.isActive || !product?.isActive) {
              throw new Error(`INSUFFICIENT_STOCK:${item.productId}:0`)
            }

            if (bgId) {
              // Pool-linked: pool stock already decremented in Pass 1.
              // Only update product-level counters here.
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                  stickerStock: { decrement: item.quantity }
                }
              })
            } else {
              // Non-pool variant: validate and decrement variant stock
              const startVarFind = Date.now()
              const variantFull = await tx.productVariant.findUnique({
                where: { id: item.variantId },
                select: { stock: true }
              })
              console.log(`[PERF] tx.productVariant.findUnique query took: ${Date.now() - startVarFind}ms`)

              const combinedStock = variantFull?.stock ?? 0
              if (combinedStock < item.quantity) {
                throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${combinedStock}`)
              }
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } }
              })
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                  stickerStock: { decrement: item.quantity }
                }
              })
            }
          } else {
            // No variant: product-only stock check and decrement
            const startProdFind = Date.now()
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, isActive: true }
            })
            console.log(`[PERF] tx.product.findUnique (no-variant) query took: ${Date.now() - startProdFind}ms`)

            if (!product?.isActive || (product?.stock ?? 0) < item.quantity) {
              throw new Error(`INSUFFICIENT_STOCK:${item.productId}:${product?.stock ?? 0}`)
            }
            const startProdUpdate = Date.now()
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                stickerStock: { decrement: item.quantity }
              }
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
      }, {
        maxWait: 10000,
        timeout: 20000
      }).catch((txError: Error) => {
        if (txError.message.startsWith('INSUFFICIENT_STOCK:')) {
          const [, productId, available] = txError.message.split(':')
          const err = new Error('INSUFFICIENT_STOCK') as any
          err.productId = productId
          err.available = parseInt(available)
          throw err
        }
        if (txError.message.startsWith('POOL_INACTIVE:')) {
          const [, productId] = txError.message.split(':')
          const err = new Error('INSUFFICIENT_STOCK') as any
          err.productId = productId
          err.available = 0
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

          try {
            await emailService.sendAdminOrderAlert(emailData)
          } catch (adminEmailError) {
            console.error('Failed to send admin order alert email:', adminEmailError)
          }
        } else {
          emailService.sendOrderConfirmation(emailData).catch((emailError) => {
            errorLogger.error('Failed to send order confirmation email in background', { 
              orderId: order.id,
              customerEmail: shippingAddress.email 
            }, emailError as Error)
            console.error('Failed to send order confirmation email in background:', emailError)
          })

          emailService.sendAdminOrderAlert(emailData).catch((adminEmailError) => {
            console.error('Failed to send admin order alert email in background:', adminEmailError)
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
      // All other transaction or DB errors: log and return a real 500.
      // The mock-success fallback was removed — a transaction failure must never
      // silently return success to the customer.
      errorLogger.logDatabaseError('create', 'orders', dbError as Error, { 
        userId: userId,
        itemCount: items.length,
        totalAmount 
      })
      console.error('[ORDER FAIL] Unexpected error during order transaction:', dbError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Bestellung. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
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