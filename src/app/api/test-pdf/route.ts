import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createInvoicePDF } from '@/lib/email/InvoicePDF'
import React from 'react'
import * as fs from 'fs'
import * as path from 'path'

// Only for development — view the PDF directly in browser to check logo
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Debug: list logo candidates
  const candidates = ['public/attireburg-logo.png', 'public/logo.png', 'Images/Attireburg logo.png']
  const found: Record<string, string> = {}
  for (const p of candidates) {
    const full = path.join(process.cwd(), p)
    try {
      const stat = fs.statSync(full)
      found[p] = `${stat.size} bytes`
    } catch {
      found[p] = 'NOT FOUND'
    }
  }
  console.log('[test-pdf] Logo candidates:', found)

  try {
    const element = await createInvoicePDF({
      invoiceNumber: 'AB-2026-TEST',
      orderNumber: 'ATB-TEST01',
      invoiceDate: '19.06.2026',
      customer: {
        firstName: 'Max',
        lastName: 'Mustermann',
        street: 'Musterstraße 1',
        city: 'Regensburg',
        postalCode: '93059',
        country: 'Deutschland',
        email: 'max@beispiel.de',
      },
      items: [
        { pos: 1, artikelNr: '1000057390', description: 'Attireburg Hoodie [Schwarz] [L] [Slim]', quantity: 1, unitPriceNet: 46.21, totalNet: 46.21 },
        { pos: 2, artikelNr: '1000060429', description: 'Attireburg Sweat Shirt [Grau] [M]', quantity: 1, unitPriceNet: 37.81, totalNet: 37.81 },
      ],
      subtotalNet: 84.02,
      shippingNet: 4.19,
      taxableAmount: 88.21,
      vatRate: 19,
      vatAmount: 16.76,
      grossTotal: 104.97,
      paymentMethod: 'PayPal',
      paymentDate: '19.06.2026',
      lang: 'de',
    })

    const buffer = await renderToBuffer(element as any)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="test-invoice.pdf"',
      },
    })
  } catch (error) {
    console.error('[test-pdf] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      logoFiles: found,
    }, { status: 500 })
  }
}
