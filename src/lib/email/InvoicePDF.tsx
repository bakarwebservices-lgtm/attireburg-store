import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet, Font
} from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

// Register Arial-like font using built-in Helvetica
Font.register({
  family: 'Helvetica',
  fonts: []
})

const cream = '#eae3d2'
const dark = '#111111'
const blue = '#1a5cb8'

const styles = StyleSheet.create({
  page: {
    width: 595,     // A4 pt width
    height: 842,    // A4 pt height
    position: 'relative',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: dark,
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  // Top right company address
  topHeader: {
    position: 'absolute',
    top: 9,
    right: 33,
    textAlign: 'right',
  },
  companyName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  companySmall: { fontSize: 8.5, lineHeight: 1.5 },
  // Info section
  infoSection: {
    position: 'absolute',
    top: 78,
    left: 45,
    right: 45,
    flexDirection: 'row',
    gap: 10,
  },
  infoCol: { flex: 1 },
  infoColRight: { flex: 1, alignItems: 'flex-end' },
  infoHeading: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 3 },
  infoText: { fontSize: 8.5, lineHeight: 1.5 },
  infoBlue: { fontSize: 8.5, color: blue },
  // Table
  tableWrap: {
    position: 'absolute',
    top: 200,
    left: 45,
    right: 45,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: cream,
    borderWidth: 1,
    borderColor: dark,
    height: 26,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: dark,
    minHeight: 22,
    backgroundColor: '#ffffff',
  },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    padding: '5 5',
    borderRightWidth: 1,
    borderColor: dark,
  },
  td: {
    fontSize: 8.5,
    padding: '4 5',
    borderRightWidth: 1,
    borderColor: dark,
  },
  colNr: { width: 35 },
  colArtikel: { width: 67 },
  colProdukt: { flex: 1 },
  colMenge: { width: 66, textAlign: 'center' },
  colEinzel: { width: 66, textAlign: 'right' },
  colGesamt: { width: 67, textAlign: 'right', borderRightWidth: 0 },
  // Totals — positioned dynamically below the table
  totalsSection: {
    position: 'absolute',
    top: 440,   // safely below table even with many rows
    right: 45,
    width: 218,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalsLabel: { fontSize: 9 },
  totalsValue: { fontSize: 9 },
  totalsItalic: { fontSize: 9, fontStyle: 'italic' } as any,
  totalsGross: { fontSize: 10, fontFamily: 'Helvetica-Bold', paddingTop: 5, paddingBottom: 2 },
  totalsPayment: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  blueText: { color: blue },
  // Thank you
  thankYou: {
    position: 'absolute',
    bottom: 83,
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#333333',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 41,
    left: 0, right: 0,
    height: 26,
    backgroundColor: cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  footerText: { fontSize: 7, color: '#333333', textAlign: 'center', lineHeight: 1.6 },
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

function formatEur(n: number) {
  return n.toFixed(2).replace('.', ',')
}

export function createInvoicePDF(data: InvoiceData) {
  // Load background image as base64
  const bgPath = path.join(process.cwd(), 'Images', 'email invoice bg.png')
  let bgSrc: string | undefined
  try {
    const buf = fs.readFileSync(bgPath)
    bgSrc = `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    bgSrc = undefined
  }

  const isDE = (data.lang || 'de') === 'de'

  const labels = isDE ? {
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
        {/* Background */}
        {bgSrc && <Image src={bgSrc} style={styles.bgImage} />}

        {/* Company address top-right */}
        <View style={styles.topHeader}>
          <Text style={styles.companyName}>ATTIREBURG</Text>
          <Text style={styles.companySmall}>Im Gewerbepark C25,</Text>
          <Text style={styles.companySmall}>Regensburg 93059, DE</Text>
          <Text style={styles.companySmall}>USt.-ID-Nr: DE455977446</Text>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoHeading}>{labels.kunde}</Text>
            <Text style={styles.infoText}>{data.customer.firstName} {data.customer.lastName}</Text>
            <Text style={styles.infoText}>{data.customer.street}</Text>
            <Text style={styles.infoText}>{data.customer.city}</Text>
            <Text style={styles.infoText}>{data.customer.postalCode} {data.customer.country}</Text>
            <Text style={styles.infoBlue}>{data.customer.email}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoHeading}>{labels.versand}</Text>
            <Text style={styles.infoText}>{data.customer.firstName} {data.customer.lastName}</Text>
            <Text style={styles.infoText}>{data.customer.street}</Text>
            <Text style={styles.infoText}>{data.customer.city}</Text>
            <Text style={styles.infoText}>{data.customer.postalCode} {data.customer.country}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.infoHeading}>{labels.rechnung} {data.invoiceNumber}</Text>
            <Text style={styles.infoText}>{labels.bestellnummer} {data.orderNumber}</Text>
            <Text style={styles.infoText}>{labels.datum} {data.invoiceDate}</Text>
            <Text style={styles.infoText}>{labels.leistung}</Text>
          </View>
        </View>

        {/* Table + Totals as a flow block */}
        <View style={{ position: 'absolute', top: 200, left: 45, right: 45 }}>
          {/* Table */}
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNr]}>{labels.nr}</Text>
              <Text style={[styles.th, styles.colArtikel]}>{labels.artikel}</Text>
              <Text style={[styles.th, styles.colProdukt]}>{labels.produkt}</Text>
              <Text style={[styles.th, styles.colMenge, { textAlign: 'center' }]}>{labels.menge}</Text>
              <Text style={[styles.th, styles.colEinzel, { textAlign: 'right' }]}>{labels.einzel}</Text>
              <Text style={[styles.th, styles.colGesamt, { textAlign: 'right', borderRightWidth: 0 }]}>{labels.gesamt}</Text>
            </View>
            {data.items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colNr]}>{item.pos}</Text>
                <Text style={[styles.td, styles.colArtikel]}>{item.artikelNr}</Text>
                <Text style={[styles.td, styles.colProdukt]}>{item.description}</Text>
                <Text style={[styles.td, styles.colMenge]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colEinzel]}>{formatEur(item.unitPriceNet)}</Text>
                <Text style={[styles.td, styles.colGesamt]}>{formatEur(item.totalNet)}</Text>
              </View>
            ))}
          </View>

          {/* Totals — right-aligned, with gap below table */}
          <View style={{ marginTop: 18, alignItems: 'flex-end' }}>
            <View style={{ width: 218 }}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{labels.zwischensumme}</Text>
                <Text style={styles.totalsValue}>{formatEur(data.subtotalNet)}</Text>
              </View>
              {data.discount && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{labels.rabatt} [{data.discount.code}]</Text>
                  <Text style={styles.totalsValue}>-{formatEur(data.discount.amount)}</Text>
                </View>
              )}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{labels.versandNetto}</Text>
                <Text style={styles.totalsValue}>{formatEur(data.shippingNet)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsItalic}>{labels.steuerpflichtig}</Text>
                <Text style={styles.totalsItalic}>{formatEur(data.taxableAmount)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsItalic}>{labels.mwst}</Text>
                <Text style={styles.totalsItalic}>{formatEur(data.vatAmount)}</Text>
              </View>
              <View style={[styles.totalsRow, { borderTopWidth: 1, borderColor: dark, marginTop: 3 }]}>
                <Text style={styles.totalsGross}>{labels.brutto}</Text>
                <Text style={styles.totalsGross}>{formatEur(data.grossTotal)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{labels.bezahlt}</Text>
                <Text style={styles.totalsValue}>{formatEur(data.grossTotal)}</Text>
              </View>
              <View style={[styles.totalsRow, { marginTop: 2 }]}>
                <Text style={styles.totalsPayment}>{labels.zahlungsmethode}</Text>
                <Text style={styles.totalsPayment}>{data.paymentMethod.toUpperCase()}</Text>
              </View>
              {data.paymentDate && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{labels.zahlungsdatum}</Text>
                  <Text style={[styles.totalsValue, styles.blueText]}>{data.paymentDate}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Thank you */}
        <View style={styles.thankYou}>
          <Text>{labels.danke}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ATTIREBURG | Anschrift: Im Gewerbepark C25, 93059, Regensburg | Website: www.attireburg.de | Email: kontakt@attireburg.de | USt.-ID-Nr: DE 455 977 446 | Inhaberin: Khadija Tehami
          </Text>
        </View>
      </Page>
    </Document>
  )
}
