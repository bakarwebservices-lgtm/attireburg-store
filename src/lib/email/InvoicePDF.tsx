import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet
} from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

const cream = '#eae3d2'
const dark = '#333333'
const blue = '#1a5cb8'
const white = '#ffffff'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: dark,
    backgroundColor: white,
    flexDirection: 'column',
  },
  // ── TOP CREAM BAND ──
  topBand: {
    backgroundColor: cream,
    paddingHorizontal: 33,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 66,
  },
  logo: { height: 45, width: 'auto' } as any,
  companyBlock: { textAlign: 'right' },
  companyName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  companySmall: { fontSize: 8.5, lineHeight: 1.6 },
  // ── INFO SECTION ──
  infoSection: {
    paddingHorizontal: 33,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 12,
  } as any,
  infoCol: { flex: 1 },
  infoColRight: { flex: 1, alignItems: 'flex-end' } as any,
  infoHeading: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4 },
  infoText: { fontSize: 8.5, lineHeight: 1.6 },
  infoBlue: { fontSize: 8.5, color: blue },
  // ── TABLE WRAP ──
  tableWrap: {
    paddingHorizontal: 33,
    marginBottom: 16,
  },
  // ── TABLE ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: cream,
    borderWidth: 1,
    borderColor: dark,
    height: 24,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: dark,
    minHeight: 20,
    backgroundColor: white,
  },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderColor: dark,
    justifyContent: 'center',
  } as any,
  td: {
    fontSize: 8.5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRightWidth: 1,
    borderColor: dark,
  },
  // column widths
  colNr: { width: 32 },
  colArtikel: { width: 71 },
  colProdukt: { flex: 1 },
  colMenge: { width: 62, textAlign: 'center' },
  colEinzel: { width: 82, textAlign: 'right' },
  colGesamt: { width: 73, textAlign: 'right', borderRightWidth: 0 },
  // ── TOTALS ──
  totalsWrap: {
    paddingHorizontal: 33,
    alignItems: 'flex-end',
    marginBottom: 44,
  } as any,
  totalsInner: { width: 218 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.8,
  },
  totalsLabel: { fontSize: 9, color: dark },
  totalsValue: { fontSize: 9, color: dark },
  totalsItalic: { fontSize: 9, color: dark, fontStyle: 'italic' } as any,
  totalsGrossLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: dark },
  totalsGrossValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: dark },
  totalsPayLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: dark, marginTop: 2 },
  totalsPayValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: dark, marginTop: 2 },
  grossSeparator: { borderTopWidth: 1, borderColor: dark, marginTop: 2, paddingTop: 5 },
  blueText: { color: blue },
  // ── SPACER ──
  spacer: { flex: 1 },
  // ── THANK YOU ──
  thankYou: {
    textAlign: 'center',
    fontSize: 9,
    color: '#333333',
    paddingVertical: 18,
  },
  // ── BOTTOM CREAM BAND ──
  bottomBand: {
    backgroundColor: cream,
    paddingHorizontal: 30,
    paddingVertical: 8,
    alignItems: 'center',
  } as any,
  footerText: { fontSize: 7.5, color: '#333333', textAlign: 'center', lineHeight: 1.7 },
})

export interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  invoiceDate: string
  customer: {
    firstName: string
    lastName: string
    street: string
    city: string
    postalCode: string
    country: string
    email: string
  }
  items: Array<{
    pos: number
    artikelNr: string
    description: string
    quantity: number
    unitPriceNet: number
    totalNet: number
  }>
  subtotalNet: number
  discount?: { code: string; amount: number }
  shippingNet: number
  taxableAmount: number
  vatRate: number
  vatAmount: number
  grossTotal: number
  paymentMethod: string
  paymentDate?: string
  lang?: 'de' | 'en'
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function loadImage(relativePath: string): string | undefined {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), relativePath))
    const ext = relativePath.split('.').pop()?.toLowerCase() || 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return undefined
  }
}

export function createInvoicePDF(data: InvoiceData) {
  const logoSrc = loadImage('Images/Attireburg logo.png')
  const isDE = (data.lang || 'de') === 'de'

  const L = isDE ? {
    kunde: 'Kunde',
    versand: 'Versandadresse',
    rechnung: 'RECHNUNG Nr.',
    bestellnummer: 'Bestellnummer:',
    datum: 'Rechnungsdatum:',
    leistung: 'Leistungsdatum: entspricht Rechnungsdatum',
    nr: 'Nr.',
    artikel: 'Artikel',
    produkt: 'Produkt',
    menge: 'Menge (Stk.)',
    einzel: 'Einzelpreis netto',
    gesamt: 'Gesamt netto',
    zwischensumme: 'Zwischensumme (netto)',
    rabatt: 'Rabatt',
    versandNetto: 'Versand (netto)',
    steuerpflichtig: 'Steuerpflichtiger Betrag',
    mwst: `zzgl. MwSt. ${data.vatRate}%`,
    brutto: 'GESAMT BRUTTO (EUR)',
    bezahlt: 'Ganz bezahlt',
    zahlungsmethode: 'ZAHLUNGSMETHODE',
    zahlungsdatum: 'Zahlungsdatum:',
    danke: 'Vielen Dank für Ihre Bestellung!',
  } : {
    kunde: 'Customer',
    versand: 'Shipping Address',
    rechnung: 'INVOICE No.',
    bestellnummer: 'Order number:',
    datum: 'Invoice date:',
    leistung: 'Service date: same as invoice date',
    nr: 'No.',
    artikel: 'Item',
    produkt: 'Product',
    menge: 'Qty (pcs.)',
    einzel: 'Unit price net',
    gesamt: 'Total net',
    zwischensumme: 'Subtotal (net)',
    rabatt: 'Discount',
    versandNetto: 'Shipping (net)',
    steuerpflichtig: 'Taxable amount',
    mwst: `plus VAT ${data.vatRate}%`,
    brutto: 'GROSS TOTAL (EUR)',
    bezahlt: 'Paid in full',
    zahlungsmethode: 'PAYMENT METHOD',
    zahlungsdatum: 'Payment date:',
    danke: 'Thank you for your order!',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── TOP CREAM BAND ── */}
        <View style={styles.topBand}>
          {logoSrc
            ? <Image src={logoSrc} style={styles.logo} />
            : <Text style={styles.companyName}>ATTIREBURG</Text>
          }
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>ATTIREBURG</Text>
            <Text style={styles.companySmall}>Im Gewerbepark C25,</Text>
            <Text style={styles.companySmall}>Regensburg 93059, DE</Text>
            <Text style={styles.companySmall}>USt.-ID-Nr: DE455977446</Text>
          </View>
        </View>

        {/* ── INFO SECTION ── */}
        <View style={styles.infoSection}>
          {/* Customer */}
          <View style={styles.infoCol}>
            <Text style={styles.infoHeading}>{L.kunde}</Text>
            <Text style={styles.infoText}>{data.customer.firstName} {data.customer.lastName}</Text>
            <Text style={styles.infoText}>{data.customer.street}</Text>
            <Text style={styles.infoText}>{data.customer.city}</Text>
            <Text style={styles.infoText}>{data.customer.postalCode} {data.customer.country}</Text>
            <Text style={styles.infoBlue}>{data.customer.email}</Text>
          </View>
          {/* Shipping address (same as billing) */}
          <View style={styles.infoCol}>
            <Text style={styles.infoHeading}>{L.versand}</Text>
            <Text style={styles.infoText}>{data.customer.firstName} {data.customer.lastName}</Text>
            <Text style={styles.infoText}>{data.customer.street}</Text>
            <Text style={styles.infoText}>{data.customer.city}</Text>
            <Text style={styles.infoText}>{data.customer.postalCode} {data.customer.country}</Text>
          </View>
          {/* Invoice details */}
          <View style={styles.infoColRight}>
            <Text style={[styles.infoHeading, { textAlign: 'right' }]}>{L.rechnung} {data.invoiceNumber}</Text>
            <Text style={[styles.infoText, { textAlign: 'right' }]}>{L.bestellnummer} {data.orderNumber}</Text>
            <Text style={[styles.infoText, { textAlign: 'right' }]}>{L.datum} {data.invoiceDate}</Text>
            <Text style={[styles.infoText, { textAlign: 'right' }]}>{L.leistung}</Text>
          </View>
        </View>

        {/* ── TABLE ── */}
        <View style={styles.tableWrap}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNr]}>{L.nr}</Text>
            <Text style={[styles.th, styles.colArtikel]}>{L.artikel}</Text>
            <Text style={[styles.th, styles.colProdukt]}>{L.produkt}</Text>
            <Text style={[styles.th, styles.colMenge]}>{L.menge}</Text>
            <Text style={[styles.th, styles.colEinzel]}>{L.einzel}</Text>
            <Text style={[styles.th, styles.colGesamt]}>{L.gesamt}</Text>
          </View>
          {/* Rows */}
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.colNr]}>{item.pos}</Text>
              <Text style={[styles.td, styles.colArtikel]}>{item.artikelNr}</Text>
              <Text style={[styles.td, styles.colProdukt]}>{item.description}</Text>
              <Text style={[styles.td, styles.colMenge]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colEinzel]}>{fmt(item.unitPriceNet)}</Text>
              <Text style={[styles.td, styles.colGesamt]}>{fmt(item.totalNet)}</Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS (right-aligned, below table with gap) ── */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsInner}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{L.zwischensumme}</Text>
              <Text style={styles.totalsValue}>{fmt(data.subtotalNet)}</Text>
            </View>
            {data.discount && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{L.rabatt} [{data.discount.code}]</Text>
                <Text style={styles.totalsValue}>-{fmt(data.discount.amount)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{L.versandNetto}</Text>
              <Text style={styles.totalsValue}>{fmt(data.shippingNet)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsItalic}>{L.steuerpflichtig}</Text>
              <Text style={styles.totalsItalic}>{fmt(data.taxableAmount)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsItalic}>{L.mwst}</Text>
              <Text style={styles.totalsItalic}>{fmt(data.vatAmount)}</Text>
            </View>
            {/* Gross total with top border */}
            <View style={[styles.totalsRow, styles.grossSeparator]}>
              <Text style={styles.totalsGrossLabel}>{L.brutto}</Text>
              <Text style={styles.totalsGrossValue}>{fmt(data.grossTotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{L.bezahlt}</Text>
              <Text style={styles.totalsValue}>{fmt(data.grossTotal)}</Text>
            </View>
            <View style={[styles.totalsRow, { marginTop: 3 }]}>
              <Text style={styles.totalsPayLabel}>{L.zahlungsmethode}</Text>
              <Text style={styles.totalsPayValue}>{data.paymentMethod.toUpperCase()}</Text>
            </View>
            {data.paymentDate && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{L.zahlungsdatum}</Text>
                <Text style={[styles.totalsValue, styles.blueText]}>{data.paymentDate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── SPACER ── */}
        <View style={styles.spacer} />

        {/* ── THANK YOU ── */}
        <Text style={styles.thankYou}>{L.danke}</Text>

        {/* ── BOTTOM CREAM BAND ── */}
        <View style={styles.bottomBand}>
          <Text style={styles.footerText}>
            ATTIREBURG | Anschrift: Im Gewerbepark C25, 93059, Regensburg | Website: www.attireburg.de | Email: kontakt@attireburg.de | USt.-ID-Nr: DE 455 977 446 | Inhaberin: Khadija Tehami
          </Text>
        </View>

      </Page>
    </Document>
  )
}
