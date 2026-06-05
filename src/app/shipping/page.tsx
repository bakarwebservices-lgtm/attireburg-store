'use client'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import LegalLayout from '@/components/LegalLayout'

export default function Shipping() {
  const { lang } = useLanguage()

  const de = (
    <>
      <h1>Versandinformationen</h1>

      <h2>Liefergebiet</h2>
      <p>Wir liefern aktuell ausschließlich innerhalb Deutschlands.</p>

      <h2>Versandkosten</h2>
      <p>Ab einem Bestellwert von <strong>50 €</strong> ist der Versand kostenlos.</p>
      <p>Darunter berechnen wir eine Versandpauschale von <strong>4,99 €</strong>.</p>

      <h2>Lieferzeiten</h2>
      <ul>
        <li><strong>Standard-Versand:</strong> 2–5 Werktage</li>
        <li><strong>Express-Versand:</strong> 1–2 Werktage (gegen Aufpreis)</li>
      </ul>
      <p>Bestellungen, die bis 12:00 Uhr eingehen, werden in der Regel noch am selben Tag bearbeitet (Montag–Freitag, außer Feiertage).</p>

      <h2>Versandpartner</h2>
      <p>Wir versenden mit DHL. Nach dem Versand erhalten Sie eine Tracking-E-Mail mit Ihrer Sendungsnummer.</p>

      <h2>Lieferverzögerungen</h2>
      <p>Bei unvorhergesehenen Verzögerungen (z. B. durch höhere Gewalt, Streiks oder extreme Wetterverhältnisse) informieren wir Sie umgehend per E-Mail.</p>

      <h2>Weitere Fragen?</h2>
      <p>Kontaktieren Sie uns unter <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> oder besuchen Sie unsere <a href="/faq">FAQ-Seite</a>.</p>
    </>
  )

  const en = (
    <>
      <h1>Shipping Information</h1>

      <h2>Delivery Area</h2>
      <p>We currently deliver exclusively within Germany.</p>

      <h2>Shipping Costs</h2>
      <p>Shipping is free for orders over <strong>€50</strong>.</p>
      <p>Below that, we charge a flat rate of <strong>€4.99</strong>.</p>

      <h2>Delivery Times</h2>
      <ul>
        <li><strong>Standard shipping:</strong> 2–5 business days</li>
        <li><strong>Express shipping:</strong> 1–2 business days (surcharge applies)</li>
      </ul>
      <p>Orders placed before 12:00 noon are usually processed the same day (Monday–Friday, excluding public holidays).</p>

      <h2>Shipping Partners</h2>
      <p>We ship with DHL. After dispatch you will receive a tracking email with your shipment number.</p>

      <h2>Delivery Delays</h2>
      <p>In case of unforeseen delays (e.g. force majeure, strikes, extreme weather), we will notify you promptly by email.</p>

      <h2>Questions?</h2>
      <p>Contact us at <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> or visit our <a href="/faq">FAQ page</a>.</p>
    </>
  )

  return (
    <LegalLayout pageId="shipping" updatedDate="2025">
      {lang === 'de' ? de : en}
    </LegalLayout>
  )
}
