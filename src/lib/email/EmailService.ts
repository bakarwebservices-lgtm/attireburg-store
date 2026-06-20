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
      // Prices coming in are GROSS (VAT included)
      const itemsGross = data.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const subtotalNet = itemsGross / (1 + vatRate / 100)
      // Shipping = totalAmount minus items gross (may include COD fee at 0% VAT)
      const extraFees = data.totalAmount - itemsGross
      // Assume shipping is standard 0-4.99, COD 2.50 — pass shipping gross separately if available
      // For now derive net from gross total
      const grossTotal = data.totalAmount
      const shippingGross = extraFees > 0 ? extraFees : 0
      const shippingNet = shippingGross / (1 + vatRate / 100)
      const taxableAmount = subtotalNet + shippingNet
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
        grossTotal,
        paymentMethod: data.paymentMethod,
        paymentDate: new Intl.DateTimeFormat('de-DE').format(new Date()),
      }

      const pdfElement = await createInvoicePDF(invoiceData)
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

  async sendCustomizeInquiry(data: {
    clientType: 'individual' | 'business'
    name: string
    email: string
    phone?: string
    company?: string
    message?: string
    fileName?: string
    fileBuffer?: Buffer
    fileType?: string
    fileUrl?: string
  }): Promise<boolean> {
    const ownerEmail = process.env.OWNER_EMAIL || 'tehami.k719@gmail.com'

    // 1. Email to the Owner
    const ownerSubject = `[Print on Demand] Neue Anfrage von ${data.name} (${data.clientType === 'business' ? 'Unternehmen' : 'Privatperson'})`
    const ownerText = `
Neue Print on Demand Anfrage erhalten!

Details:
-----------------------------------------
Name: ${data.name}
E-Mail: ${data.email}
Telefon: ${data.phone || 'Nicht angegeben'}
Kundentyp: ${data.clientType === 'business' ? 'Unternehmen' : 'Privatperson'}
${data.clientType === 'business' ? `Firma: ${data.company || 'Nicht angegeben'}\n` : ''}
Beschreibung / Wünsche:
${data.message || 'Keine Beschreibung angegeben.'}
-----------------------------------------
${data.fileName ? `Design-Datei: ${data.fileName}\n` : ''}${data.fileUrl ? `Download-Link: ${data.fileUrl}\n` : ''}
Diese Anfrage wurde über das Print-on-Demand Formular eingereicht.
`
    const ownerHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="background: #47131e; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">Neue Print on Demand Anfrage</h2>
        <p>Hallo Admin,</p>
        <p>eine neue Print on Demand Anfrage wurde eingereicht:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">E-Mail:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Telefon:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.phone || 'Nicht angegeben'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kundentyp:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.clientType === 'business' ? 'Unternehmen' : 'Privatperson'}</td>
          </tr>
          ${data.clientType === 'business' ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Firma:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.company || 'Nicht angegeben'}</td>
          </tr>
          ` : ''}
        </table>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 20px;">
          <h4 style="margin-top: 0;">Beschreibung / Wünsche:</h4>
          <p style="white-space: pre-wrap; margin-bottom: 0;">${data.message || 'Keine Beschreibung angegeben.'}</p>
        </div>
        
        ${data.fileName ? `
        <div style="margin-top: 20px; padding: 15px; border: 1px solid #eee; border-radius: 6px; background: #fff;">
          <p style="margin-top: 0; font-weight: bold;">Angehängte Design-Datei:</p>
          <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">Dateiname: ${data.fileName}</p>
          
          ${data.fileUrl ? `
          <p style="margin-bottom: 15px;">
            <a href="${data.fileUrl}" target="_blank" style="display: inline-block; background: #47131e; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-size: 0.9em; font-weight: bold;">Datei im Browser öffnen / herunterladen</a>
          </p>
          ` : ''}
          
          ${data.fileType?.startsWith('image/') ? `
          <div style="margin-top: 15px; border: 1px solid #ddd; padding: 5px; border-radius: 4px; display: inline-block; max-width: 100%;">
            <img src="cid:designFile" alt="Design-Vorschau" style="max-width: 100%; max-height: 350px; display: block; height: auto;" />
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #666; text-align: center;">Attireburg - Premium Deutsche Kleidung</p>
      </div>
    `

    const attachments = data.fileBuffer && data.fileName ? [{
      filename: data.fileName,
      content: data.fileBuffer,
      contentType: data.fileType || 'application/octet-stream',
      ...(data.fileType?.startsWith('image/') ? { cid: 'designFile' } : {})
    }] : undefined

    const ownerEmailSent = await this.sendSMTPEmail(ownerEmail, {
      subject: ownerSubject,
      text: ownerText,
      html: ownerHtml
    }, { attachments })

    // 2. Confirmation Email to the Customer
    const customerSubject = `Ihre Print-on-Demand Anfrage bei Attireburg`
    const customerText = `
Hallo ${data.name},

vielen Dank für Ihre Print-on-Demand Anfrage bei Attireburg!

Wir haben Ihre Nachricht und Details erhalten. Unser Team wird Ihre Anfrage prüfen und sich in Kürze mit Ihnen in Verbindung setzen.

Ihre Anfrage-Details:
- Kundentyp: ${data.clientType === 'business' ? 'Unternehmen' : 'Privatperson'}
- Nachricht: ${data.message || 'Keine Beschreibung angegeben'}
${data.fileName ? `- Design-Datei: ${data.fileName}\n` : ''}${data.fileUrl ? `- Download-Link: ${data.fileUrl}\n` : ''}
Mit freundlichen Grüßen,
Ihr Attireburg Team
`

    const customerHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="background: #47131e; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">Vielen Dank für Ihre Anfrage</h2>
        <p>Hallo ${data.name},</p>
        <p>vielen Dank für Ihre Print-on-Demand Anfrage bei Attireburg!</p>
        <p>Wir haben Ihre Anfrage erhalten. Unser Team prüft Ihre Anforderungen und wird sich in Kürze (normalerweise innerhalb von 24 Stunden) mit einem individuellen Angebot bei Ihnen melden.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #47131e;">Zusammenfassung Ihrer Anfrage:</h4>
          <p><strong>Typ:</strong> ${data.clientType === 'business' ? 'Unternehmen' : 'Privatperson'}</p>
          <p><strong>Nachricht:</strong> ${data.message || 'Keine Beschreibung angegeben'}</p>
          ${data.fileName ? `
            <p><strong>Design-Datei:</strong> ${data.fileName} 
              ${data.fileUrl ? `(<a href="${data.fileUrl}" target="_blank" style="color: #47131e; text-decoration: underline; font-weight: bold;">Ansehen / Herunterladen</a>)` : ''}
            </p>
          ` : ''}
        </div>
        
        <p>Falls Sie noch Fragen haben oder weitere Details hinzufügen möchten, können Sie einfach auf diese E-Mail antworten.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #666; text-align: center;">Attireburg - Premium Deutsche Kleidung</p>
      </div>
    `

    const customerEmailSent = await this.sendSMTPEmail(data.email, {
      subject: customerSubject,
      text: customerText,
      html: customerHtml
    })

    return ownerEmailSent && customerEmailSent
  }
}

export const emailService = new EmailService()
export type { OrderConfirmationData, RestockNotificationData }