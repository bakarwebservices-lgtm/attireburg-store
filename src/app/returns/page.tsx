'use client'
import { useLanguage } from '@/components/ClientLayout'
import LegalLayout from '@/components/LegalLayout'

export default function Returns() {
  const { lang } = useLanguage()

  const de = (
    <>
      <h1>Rückgabe &amp; Widerruf</h1>

      <h2>Gesetzliches Widerrufsrecht</h2>
      <p>Gemäß § 312d BGB haben Sie als Verbraucher das Recht, binnen <strong>14 Tagen</strong> ohne Angabe von Gründen diesen Vertrag zu widerrufen. Wir verlängern diese Frist kulanzhalber auf <strong>30 Tage</strong> ab Lieferdatum.</p>

      <h2>So funktioniert die Rückgabe</h2>
      <ul>
        <li>Senden Sie eine E-Mail an <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> mit Ihrer Bestellnummer und dem Rückgabegrund.</li>
        <li>Wir senden Ihnen ein kostenloses Rücksendeetikett zu.</li>
        <li>Verpacken Sie die Ware sorgfältig und senden Sie sie an die auf dem Etikett angegebene Adresse.</li>
        <li>Nach Eingang und Prüfung der Ware erstatten wir den Kaufpreis innerhalb von <strong>5–7 Werktagen</strong>.</li>
      </ul>

      <h2>Bedingungen für die Rückgabe</h2>
      <ul>
        <li>Die Ware muss ungetragen, ungewaschen und mit allen Etiketten versehen sein.</li>
        <li>Originalverpackung wird empfohlen, ist aber keine Voraussetzung.</li>
        <li>Personalisierte Artikel (Print on Demand) sind vom Widerrufsrecht ausgeschlossen.</li>
      </ul>

      <h2>Rückerstattung</h2>
      <p>Die Erstattung erfolgt auf das ursprünglich verwendete Zahlungsmittel (PayPal, Kreditkarte etc.).</p>

      <h2>Kontakt</h2>
      <p>Bei Fragen zur Rückgabe: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> oder <a href="/contact">Kontaktformular</a>.</p>
    </>
  )

  const en = (
    <>
      <h1>Returns &amp; Withdrawal</h1>

      <h2>Statutory Right of Withdrawal</h2>
      <p>Under § 312d BGB, as a consumer you have the right to withdraw from this contract within <strong>14 days</strong> without giving any reason. We extend this period as a goodwill gesture to <strong>30 days</strong> from the delivery date.</p>

      <h2>How to Return</h2>
      <ul>
        <li>Email us at <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> with your order number and reason for return.</li>
        <li>We will send you a free return label.</li>
        <li>Pack the item carefully and send it to the address on the label.</li>
        <li>After receiving and checking the item, we will refund the purchase price within <strong>5–7 business days</strong>.</li>
      </ul>

      <h2>Conditions for Returns</h2>
      <ul>
        <li>Items must be unworn, unwashed and with all tags attached.</li>
        <li>Original packaging is recommended but not required.</li>
        <li>Personalised items (Print on Demand) are excluded from the right of withdrawal.</li>
      </ul>

      <h2>Refund</h2>
      <p>The refund will be made to the original payment method used (PayPal, credit card, etc.).</p>

      <h2>Contact</h2>
      <p>Questions about returns: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a> or <a href="/contact">contact form</a>.</p>
    </>
  )

  return (
    <LegalLayout pageId="returns" updatedDate="2025">
      {lang === 'de' ? de : en}
    </LegalLayout>
  )
}
