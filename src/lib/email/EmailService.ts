// Email service for order confirmations and notifications
import nodemailer from 'nodemailer'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { createInvoicePDF, InvoiceData } from './InvoicePDF'

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'resend'
  apiKey?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  fromEmail: string
  fromName: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    color?: string
  }>
  totalAmount: number
  shippingAddress: string
  paymentMethod: string
  estimatedDelivery?: string
}

interface RestockNotificationData {
  customerName: string
  customerEmail: string
  productName: string
  productUrl: string
  unsubscribeUrl: string
}

class EmailService {
  private config: EmailConfig

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'mailgun' | 'resend') || 'smtp',
      apiKey: process.env.EMAIL_API_KEY,
      smtpHost: process.env.SMTP_HOST || 'localhost',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      fromEmail: process.env.FROM_EMAIL || 'noreply@attireburg.com',
      fromName: process.env.FROM_NAME || 'Attireburg'
    }
  }

  private generateOrderConfirmationTemplate(data: OrderConfirmationData): EmailTemplate {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.name}
          ${item.size ? `<br><small>Größe: ${item.size}</small>` : ''}
          ${item.color ? `<br><small>Farbe: ${item.color}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
        </td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellbestätigung - ${data.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #47131e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f5f5f5; padding: 12px; text-align: left; }
          .total { font-weight: bold; font-size: 1.2em; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Attireburg</h1>
            <p>Vielen Dank für Ihre Bestellung!</p>
          </div>
          
          <div class="content">
            <h2>Bestellbestätigung</h2>
            <p>Liebe/r ${data.customerName},</p>
            <p>vielen Dank für Ihre Bestellung bei Attireburg. Wir haben Ihre Bestellung erhalten und bearbeiten sie bereits.</p>
            
            <div class="order-details">
              <h3>Bestellnummer: ${data.orderNumber}</h3>
              
              <h4>Bestellte Artikel:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Artikel</th>
                    <th style="text-align: center;">Anzahl</th>
                    <th style="text-align: right;">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total">
                    <td colspan="2" style="padding: 12px; text-align: right;">Gesamtbetrag:</td>
                    <td style="padding: 12px; text-align: right;">
                      ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <h4>Lieferadresse:</h4>
              <p style="white-space: pre-line;">${data.shippingAddress}</p>
              
              <h4>Zahlungsmethode:</h4>
              <p>${data.paymentMethod}</p>
              
              ${data.estimatedDelivery ? `
                <h4>Voraussichtliche Lieferung:</h4>
                <p>${data.estimatedDelivery}</p>
              ` : ''}
            </div>
            
            <p>Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.</p>
            <p>Bei Fragen können Sie uns jederzeit unter info@attireburg.com kontaktieren.</p>
            
            <p>Mit freundlichen Grüßen,<br>Ihr Attireburg Team</p>
          </div>
          
          <div class="footer">
            <p>Attireburg - Premium Deutsche Kleidung</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Bestellbestätigung - ${data.orderNumber}

Liebe/r ${data.customerName},

vielen Dank für Ihre Bestellung bei Attireburg. Wir haben Ihre Bestellung erhalten und bearbeiten sie bereits.

Bestellnummer: ${data.orderNumber}

Bestellte Artikel:
${data.items.map(item => `- ${item.name} ${item.size ? `(${item.size})` : ''} x${item.quantity} - ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}`).join('\n')}

Gesamtbetrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalAmount)}

Lieferadresse:
${data.shippingAddress}

Zahlungsmethode: ${data.paymentMethod}

${data.estimatedDelivery ? `Voraussichtliche Lieferung: ${data.estimatedDelivery}` : ''}

Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.
Bei Fragen können Sie uns jederzeit unter info@attireburg.com kontaktieren.

Mit freundlichen Grüßen,
Ihr Attireburg Team

---
Attireburg - Premium Deutsche Kleidung
Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
    `

    return {
      subject: `Bestellbestätigung - ${data.orderNumber}`,
      html,
      text
    }
  }

  private generateRestockNotificationTemplate(data: RestockNotificationData): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Artikel wieder verfügbar - ${data.productName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #47131e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .cta-button { 
            display: inline-block; 
            background: #47131e; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Attireburg</h1>
            <p>Ihr gewünschter Artikel ist wieder verfügbar!</p>
          </div>
          
          <div class="content">
            <h2>Gute Nachrichten!</h2>
            <p>Liebe/r ${data.customerName},</p>
            <p>der Artikel <strong>${data.productName}</strong>, für den Sie eine Benachrichtigung angefordert haben, ist jetzt wieder verfügbar!</p>
            
            <p>Sichern Sie sich Ihren Artikel, bevor er wieder ausverkauft ist:</p>
            
            <a href="${data.productUrl}" class="cta-button">Jetzt bestellen</a>
            
            <p>Vielen Dank für Ihr Interesse an Attireburg!</p>
            
            <p>Mit freundlichen Grüßen,<br>Ihr Attireburg Team</p>
          </div>
          
          <div class="footer">
            <p>Attireburg - Premium Deutsche Kleidung</p>
            <p><a href="${data.unsubscribeUrl}">Von weiteren Benachrichtigungen abmelden</a></p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Artikel wieder verfügbar - ${data.productName}

Liebe/r ${data.customerName},

der Artikel "${data.productName}", für den Sie eine Benachrichtigung angefordert haben, ist jetzt wieder verfügbar!

Sichern Sie sich Ihren Artikel, bevor er wieder ausverkauft ist:
${data.productUrl}

Vielen Dank für Ihr Interesse an Attireburg!

Mit freundlichen Grüßen,
Ihr Attireburg Team

---
Attireburg - Premium Deutsche Kleidung
Von weiteren Benachrichtigungen abmelden: ${data.unsubscribeUrl}
Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
    `

    return {
      subject: `Artikel wieder verfügbar - ${data.productName}`,
      html,
      text
    }
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (this.config.provider === 'smtp') {
        return await this.sendSMTPEmail(to, template)
      } else {
        // For production, implement other providers (SendGrid, Mailgun, etc.)
        console.log('Email would be sent:', { to, subject: template.subject })
        return true // Simulate success for development
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private async sendSMTPEmail(
    to: string,
    template: EmailTemplate,
    options?: { cc?: string; attachments?: Array<{ filename: string; content: Buffer; contentType: string }> }
  ): Promise<boolean> {
    // If no SMTP credentials configured, log to console (dev mode)
    if (!this.config.smtpUser || !this.config.smtpPass) {
      console.log('=== EMAIL (no SMTP configured) ===')
      console.log(`To: ${to}`)
      console.log(`Subject: ${template.subject}`)
      console.log(template.text)
      console.log('==================================')
      return true
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
      })

      await transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to,
        cc: options?.cc,
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments: options?.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      })

      console.log(`Email sent to ${to}: ${template.subject}`)
      return true
    } catch (error) {
      console.error('SMTP send failed:', error)
      return false
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    const template = this.generateOrderConfirmationTemplate(data)
    const ownerEmail = process.env.OWNER_EMAIL || 'tehami.k719@gmail.com'

    // Generate invoice PDF
    let pdfBuffer: Buffer | undefined
    try {
      const vatRate = 19
      const subtotalNet = data.items.reduce((s, i) => s + (i.price * i.quantity) / 1.19, 0)
      const shippingNet = (data.totalAmount - data.items.reduce((s, i) => s + i.price * i.quantity, 0)) / 1.19
      const taxableAmount = subtotalNet + (shippingNet > 0 ? shippingNet : 0)
      const vatAmount = taxableAmount * (vatRate / 100)

      const invoiceData: InvoiceData = {
        invoiceNumber: `AB-${new Date().getFullYear()}-${data.orderNumber.replace('ATB-', '')}`,
        orderNumber: data.orderNumber,
        invoiceDate: new Intl.DateTimeFormat('de-DE').format(new Date()),
        customer: {
          firstName: data.customerName.split(' ')[0] || data.customerName,
          lastName: data.customerName.split(' ').slice(1).join(' ') || '',
          street: data.shippingAddress.split('\n')[0] || '',
          city: data.shippingAddress.split('\n')[1]?.split(' ').slice(1).join(' ') || '',
          postalCode: data.shippingAddress.split('\n')[1]?.split(' ')[0] || '',
          country: data.shippingAddress.split('\n')[2] || 'Deutschland',
          email: data.customerEmail,
        },
        items: data.items.map((item, i) => ({
          pos: i + 1,
          artikelNr: `100${String(1000000 + i).slice(1)}`,
          description: `${item.name}${item.size ? ` [${item.size}]` : ''}${item.color ? ` [${item.color}]` : ''}`,
          quantity: item.quantity,
          unitPriceNet: item.price / 1.19,
          totalNet: (item.price * item.quantity) / 1.19,
        })),
        subtotalNet,
        shippingNet: shippingNet > 0 ? shippingNet : 0,
        taxableAmount,
        vatRate,
        vatAmount,
        grossTotal: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Intl.DateTimeFormat('de-DE').format(new Date()),
      }

      const pdfElement = createInvoicePDF(invoiceData)
      pdfBuffer = await renderToBuffer(pdfElement as any)
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      // Continue without PDF if generation fails
    }

    const attachments = pdfBuffer ? [{
      filename: `Rechnung-${data.orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined

    return await this.sendSMTPEmail(data.customerEmail, template, {
      cc: ownerEmail,
      attachments,
    })
  }

  async sendRestockNotification(data: RestockNotificationData): Promise<boolean> {
    const template = this.generateRestockNotificationTemplate(data)
    return await this.sendEmail(data.customerEmail, template)
  }

  async sendShippingNotification(orderNumber: string, customerEmail: string, customerName: string, trackingNumber?: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Ihre Bestellung ${orderNumber} wurde versandt`,
      html: `
        <h2>Ihre Bestellung ist unterwegs!</h2>
        <p>Liebe/r ${customerName},</p>
        <p>Ihre Bestellung ${orderNumber} wurde versandt und ist auf dem Weg zu Ihnen.</p>
        ${trackingNumber ? `<p>Sendungsverfolgung: <strong>${trackingNumber}</strong></p>` : ''}
        <p>Die Lieferung erfolgt in der Regel innerhalb von 2-3 Werktagen.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Attireburg Team</p>
      `,
      text: `
Ihre Bestellung ${orderNumber} wurde versandt

Liebe/r ${customerName},

Ihre Bestellung ${orderNumber} wurde versandt und ist auf dem Weg zu Ihnen.
${trackingNumber ? `Sendungsverfolgung: ${trackingNumber}` : ''}

Die Lieferung erfolgt in der Regel innerhalb von 2-3 Werktagen.

Mit freundlichen Grüßen,
Ihr Attireburg Team
      `
    }

    return await this.sendEmail(customerEmail, template)
  }
}

export const emailService = new EmailService()
export type { OrderConfirmationData, RestockNotificationData }