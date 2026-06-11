import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register a clean sans-serif font
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
})

const BRAND = '#47131e'
const LIGHT_GRAY = '#f5f5f5'
const BORDER = '#dddddd'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#222', padding: '30 40 50 40', lineHeight: 1.4 },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logoBox: { width: 120 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: BRAND, letterSpacing: 2 },
  logoSub: { fontSize: 7, color: '#666', marginTop: 2 },
  companyRight: { textAlign: 'right', fontSize: 8, color: '#444', lineHeight: 1.5 },
  companyName: { fontSize: 10, fontWeight: 'bold', color: '#222' },
  // 3-column address section
  addressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderTop: `1 solid ${BORDER}`, paddingTop: 12 },
  addressCol: { flex: 1, paddingRight: 12 },
  addressLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase', color: '#555' },
  addressText: { fontSize: 8, color: '#333', lineHeight: 1.5 },
  invoiceInfo: { textAlign: 'right' },
  invoiceNum: { fontSize: 11, fontWeight: 'bold', color: BRAND, marginBottom: 4 },
  infoLine: { fontSize: 8, color: '#444', lineHeight: 1.6 },
  // Table
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND, color: 'white', padding: '5 4', fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottom: `0.5 solid ${BORDER}`, padding: '4 4' },
  tableRowAlt: { flexDirection: 'row', borderBottom: `0.5 solid ${BORDER}`, padding: '4 4', backgroundColor: LIGHT_GRAY },
  colNr: { width: 24, textAlign: 'center' },
  colArticle: { width: 70 },
  colProduct: { flex: 1 },
  colQty: { width: 36, textAlign: 'center' },
  colPrice: { width: 50, textAlign: 'right' },
  colVat: { width: 44, textAlign: 'right' },
  colTotal: { width: 52, textAlign: 'right' },
  // Summary
  summaryWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  summaryBox: { width: 220 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3, fontSize: 9 },
  summaryLabel: { color: '#444' },
  summaryValue: { color: '#222' },
  summaryDivider: { borderTop: `1 solid ${BORDER}`, marginVertical: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  totalLabel: { fontSize: 11, fontWeight: 'bold', color: BRAND },
  totalValue: { fontSize: 11, fontWeight: 'bold', color: BRAND },
  vatNote: { fontSize: 7.5, color: '#666', fontStyle: 'italic', marginBottom: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  paymentLabel: { fontSize: 9, fontWeight: 'bold' },
  paymentValue: { fontSize: 9, fontWeight: 'bold' },
  // Thank you
  thankYou: { textAlign: 'center', fontSize: 10, color: '#444', marginBottom: 16, fontStyle: 'italic' },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTop: `0.5 solid ${BORDER}`, paddingTop: 6, textAlign: 'center', fontSize: 7, color: '#666' },
})

export interface InvoiceItem {
  nr: number
  articleNo: string
  productName: string
  quantity: number
  netPrice: number // net unit price
  total: number   // net total
}

export interface InvoiceData {
  lang: 'de' | 'en'
  invoiceNumber: string
  orderNumber: string
  invoiceDate: string
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  country: string
  email: string
  phone?: string
  items: InvoiceItem[]
  subtotalNet: number
  discount?: number
  shippingNet: number
  vatRate: number      // 19
  vatAmount: number
  grossTotal: number
  paymentMethod: string
  paymentDate?: string
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const de = data.lang === 'de'

  const labels = de ? {
    customer: 'KUNDE',
    shipping: 'VERSANDADRESSE',
    invoiceLabel: 'RECHNUNG Nr.',
    orderNo: 'Bestellnummer:',
    invoiceDate: 'Rechnungsdatum:',
    serviceDate: 'Leistungsdatum:',
    serviceDateVal: 'entspricht Rechnungsdatum',
    nr: 'Nr.',
    article: 'ARTIKEL',
    product: 'PRODUKT',
    qty: 'MENGE\n(Stk.)',
    unitPrice: 'EINZELPREIS\nNETTO',
    totalNet: 'GESAMT\nNETTO',
    vatCol: null,
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    shippingLabel: 'Versand (netto)',
    taxBase: 'Steuerpflichtiger Betrag',
    vat: `zzgl. MwSt. ${data.vatRate}%`,
    grossTotal: 'GESAMT BRUTTO',
    paid: 'Ganz bezahlt',
    paymentMethod: 'ZAHLUNGSMETHODE',
    paymentDate: 'Zahlungsdatum:',
    thankYou: 'Vielen Dank für Ihre Bestellung!',
  } : {
    customer: 'Billing to:',
    shipping: 'Shipping address:',
    invoiceLabel: 'Invoice#',
    orderNo: 'Order Number:',
    invoiceDate: 'Invoice Date:',
    serviceDate: null,
    serviceDateVal: null,
    nr: 'Sr.',
    article: 'Article no.',
    product: 'Product Name',
    qty: 'Quantity',
    unitPrice: 'Price',
    totalNet: 'Total(EUR)',
    vatCol: `VAT (${data.vatRate}%)`,
    subtotal: 'Sub Total',
    discount: 'Discount',
    shippingLabel: 'Shipping Charges',
    taxBase: null,
    vat: `Inkl. VAT (${data.vatRate}%)`,
    grossTotal: 'Total',
    paid: null,
    paymentMethod: 'Payment Method',
    paymentDate: null,
    thankYou: 'Thank you for your order!',
  }

  const taxableAmount = data.subtotalNet - (data.discount || 0) + data.shippingNet

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>ATTIREBURG</Text>
            <Text style={s.logoSub}>www.attireburg.de</Text>
          </View>
          <View style={s.companyRight}>
            <Text style={s.companyName}>ATTIREBURG</Text>
            <Text>Im Gewerbepark C25,</Text>
            <Text>Regensburg 93059, DE</Text>
            <Text>USt.-ID-Nr: DE455977446</Text>
          </View>
        </View>

        {/* Address + Invoice Info */}
        <View style={s.addressRow}>
          {/* Billing */}
          <View style={s.addressCol}>
            <Text style={s.addressLabel}>{labels.customer}</Text>
            <Text style={s.addressText}>{data.firstName} {data.lastName}</Text>
            <Text style={s.addressText}>{data.street}</Text>
            <Text style={s.addressText}>{data.city}</Text>
            <Text style={s.addressText}>{data.postalCode} {data.country}</Text>
            <Text style={s.addressText}>{data.email}</Text>
            {data.phone && <Text style={s.addressText}>{data.phone}</Text>}
          </View>

          {/* Shipping (same as billing for now) */}
          <View style={s.addressCol}>
            <Text style={s.addressLabel}>{labels.shipping}</Text>
            <Text style={s.addressText}>{data.firstName} {data.lastName}</Text>
            <Text style={s.addressText}>{data.street}</Text>
            <Text style={s.addressText}>{data.city}</Text>
            <Text style={s.addressText}>{data.postalCode} {data.country}</Text>
          </View>

          {/* Invoice Details */}
          <View style={[s.addressCol, s.invoiceInfo]}>
            <Text style={s.invoiceNum}>{labels.invoiceLabel} {data.invoiceNumber}</Text>
            <Text style={s.infoLine}>{labels.orderNo} {data.orderNumber}</Text>
            <Text style={s.infoLine}>{labels.invoiceDate} {data.invoiceDate}</Text>
            {labels.serviceDate && (
              <Text style={s.infoLine}>{labels.serviceDate} {labels.serviceDateVal}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={s.colNr}>{labels.nr}</Text>
            <Text style={s.colArticle}>{labels.article}</Text>
            <Text style={s.colProduct}>{labels.product}</Text>
            <Text style={s.colQty}>{labels.qty}</Text>
            <Text style={s.colPrice}>{labels.unitPrice}</Text>
            {labels.vatCol && <Text style={s.colVat}>{labels.vatCol}</Text>}
            <Text style={s.colTotal}>{labels.totalNet}</Text>
          </View>

          {/* Rows */}
          {data.items.map((item, i) => {
            const vatAmt = de ? null : (item.netPrice * (data.vatRate / 100))
            const rowTotal = de ? item.total : item.quantity * item.netPrice * (1 + data.vatRate / 100)
            return (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.colNr}>{item.nr}</Text>
                <Text style={s.colArticle}>{item.articleNo}</Text>
                <Text style={s.colProduct}>{item.productName}</Text>
                <Text style={s.colQty}>{item.quantity}</Text>
                <Text style={s.colPrice}>{fmt(item.netPrice)}</Text>
                {labels.vatCol && vatAmt !== null && (
                  <Text style={s.colVat}>{fmt(vatAmt)}</Text>
                )}
                <Text style={s.colTotal}>{fmt(rowTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* Summary */}
        <View style={s.summaryWrapper}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{labels.subtotal}</Text>
              <Text style={s.summaryValue}>{fmt(data.subtotalNet)}</Text>
            </View>

            {de && labels.vat && (
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { fontStyle: 'italic' }]}>{labels.vat}</Text>
                <Text style={[s.summaryValue, { fontStyle: 'italic' }]}>{fmt(data.vatAmount)}</Text>
              </View>
            )}

            {!de && (
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { fontStyle: 'italic' }]}>{labels.vat}</Text>
                <Text style={[s.summaryValue, { fontStyle: 'italic' }]}>{fmt(data.vatAmount)}</Text>
              </View>
            )}

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{labels.shippingLabel}</Text>
              <Text style={s.summaryValue}>{fmt(data.shippingNet)}</Text>
            </View>

            {data.discount !== undefined && data.discount !== 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>{labels.discount}</Text>
                <Text style={s.summaryValue}>-{fmt(data.discount)}</Text>
              </View>
            )}

            {de && labels.taxBase && (
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { fontStyle: 'italic' }]}>{labels.taxBase}</Text>
                <Text style={[s.summaryValue, { fontStyle: 'italic' }]}>{fmt(taxableAmount)}</Text>
              </View>
            )}

            <View style={s.summaryDivider} />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{labels.grossTotal}</Text>
              <Text style={s.totalValue}>{fmt(data.grossTotal)}</Text>
            </View>

            {labels.paid && (
              <View style={[s.summaryRow, { marginTop: 4 }]}>
                <Text style={s.summaryLabel}>{labels.paid}</Text>
                <Text style={s.summaryValue}>{fmt(data.grossTotal)}</Text>
              </View>
            )}

            <View style={[s.paymentRow, { marginTop: 4 }]}>
              <Text style={s.paymentLabel}>{labels.paymentMethod}</Text>
              <Text style={s.paymentValue}>{data.paymentMethod.toUpperCase()}</Text>
            </View>

            {labels.paymentDate && data.paymentDate && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>{labels.paymentDate}</Text>
                <Text style={s.summaryValue}>{data.paymentDate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Thank you */}
        <Text style={s.thankYou}>{labels.thankYou}</Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text>
            ATTIREBURG | Anschrift: Im Gewerbepark C25, 93059, Regensburg | Website: www.attireburg.de
            {' '}Email: Kontakt@attireburg.de | USt.-ID-Nr: DE 455 977 446 | Inhaberin: Khadija Tehami
          </Text>
        </View>

      </Page>
    </Document>
  )
}
