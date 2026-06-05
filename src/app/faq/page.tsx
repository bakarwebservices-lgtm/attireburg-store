'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'

const FAQ_DE = [
  {
    cat: 'Bestellungen',
    items: [
      { q: 'Wie gebe ich eine Bestellung auf?', a: 'Wählen Sie Ihr gewünschtes Produkt, wählen Sie Größe und Farbe aus und klicken Sie auf „In den Warenkorb". Gehen Sie anschließend zur Kasse und folgen Sie den Anweisungen.' },
      { q: 'Kann ich meine Bestellung nachträglich ändern oder stornieren?', a: 'Bestellungen können nur storniert werden, solange sie noch nicht versendet wurden. Bitte kontaktieren Sie uns so schnell wie möglich unter kontakt@attireburg.de.' },
      { q: 'Wie verfolge ich meine Bestellung?', a: 'Nach dem Versand erhalten Sie eine E-Mail mit Ihrer Sendungsnummer. Damit können Sie die Lieferung auf der Website des Versanddienstleisters verfolgen.' },
    ]
  },
  {
    cat: 'Versand',
    items: [
      { q: 'Wie lange dauert die Lieferung?', a: 'Die Standard-Lieferzeit beträgt 2–5 Werktage innerhalb Deutschlands. Express-Lieferung (1–2 Werktage) ist gegen Aufpreis verfügbar.' },
      { q: 'Wie hoch sind die Versandkosten?', a: 'Ab einem Bestellwert von 50 € ist der Versand kostenlos. Darunter berechnen wir eine Versandpauschale von 4,99 €.' },
      { q: 'Liefern Sie ins Ausland?', a: 'Aktuell liefern wir nur innerhalb Deutschlands.' },
    ]
  },
  {
    cat: 'Rückgabe & Umtausch',
    items: [
      { q: 'Wie lange habe ich das Rückgaberecht?', a: 'Gemäß deutschem Fernabsatzrecht haben Sie ein gesetzliches Widerrufsrecht von 14 Tagen. Wir bieten aus Kulanz 30 Tage ab Lieferdatum.' },
      { q: 'Wie funktioniert eine Rückgabe?', a: 'Senden Sie uns eine E-Mail an kontakt@attireburg.de mit Ihrer Bestellnummer und dem Grund der Rückgabe. Wir senden Ihnen dann ein Rücksendeetikett zu.' },
      { q: 'Wann erhalte ich meine Rückerstattung?', a: 'Nach Eingang und Prüfung der Rücksendung erstatten wir den Kaufpreis innerhalb von 5–7 Werktagen auf Ihr ursprüngliches Zahlungsmittel.' },
    ]
  },
  {
    cat: 'Produkte & Größen',
    items: [
      { q: 'Wie finde ich die richtige Größe?', a: 'Jede Produktseite enthält eine Größentabelle. Im Zweifelsfall empfehlen wir, eine Größe größer zu wählen, da unsere Produkte tendenziell etwas kleiner ausfallen.' },
      { q: 'Was sind die Pflegehinweise für meine Kleidung?', a: 'Alle Pflegehinweise finden Sie auf dem eingenähten Etikett im Kleidungsstück. Generell empfehlen wir Wäsche bei maximal 30 °C und das Trocknen liegend.' },
    ]
  },
  {
    cat: 'Zahlung',
    items: [
      { q: 'Welche Zahlungsmethoden akzeptieren Sie?', a: 'Wir akzeptieren PayPal, Kreditkarte, Debitkarte sowie Google Pay.' },
      { q: 'Ist die Bezahlung sicher?', a: 'Ja, alle Zahlungen werden über SSL-verschlüsselte Verbindungen abgewickelt. Wir speichern keine Kartendaten auf unseren Servern.' },
    ]
  }
]

const FAQ_EN = [
  {
    cat: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Select your product, choose size and color, and click "Add to Cart". Then proceed to checkout and follow the instructions.' },
      { q: 'Can I change or cancel my order?', a: 'Orders can only be cancelled before they are shipped. Please contact us as soon as possible at kontakt@attireburg.de.' },
      { q: 'How do I track my order?', a: 'After shipping, you will receive an email with your tracking number. You can track the delivery on the carrier\'s website.' },
    ]
  },
  {
    cat: 'Shipping',
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery within Germany takes 2–5 business days. Express delivery (1–2 days) is available for an additional fee.' },
      { q: 'How much does shipping cost?', a: 'Shipping is free for orders over €50. Below that, we charge a flat rate of €4.99.' },
      { q: 'Do you ship internationally?', a: 'Currently we only deliver within Germany.' },
    ]
  },
  {
    cat: 'Returns & Exchanges',
    items: [
      { q: 'How long is the return period?', a: 'Under German distance selling law you have a statutory 14-day right of withdrawal. We offer 30 days from the delivery date as a goodwill gesture.' },
      { q: 'How does a return work?', a: 'Email us at kontakt@attireburg.de with your order number and reason for return. We will send you a return label.' },
      { q: 'When will I receive my refund?', a: 'After receiving and checking the return, we will refund the purchase price within 5–7 business days to your original payment method.' },
    ]
  },
  {
    cat: 'Products & Sizes',
    items: [
      { q: 'How do I find the right size?', a: 'Each product page includes a size chart. If in doubt, we recommend sizing up as our products tend to run slightly small.' },
      { q: 'What are the care instructions?', a: 'All care instructions are on the sewn-in label. We generally recommend washing at max 30°C and laying flat to dry.' },
    ]
  },
  {
    cat: 'Payment',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept PayPal, credit card, debit card and Google Pay.' },
      { q: 'Is payment secure?', a: 'Yes, all payments are processed via SSL-encrypted connections. We do not store card details on our servers.' },
    ]
  }
]

export default function FAQ() {
  const { lang } = useLanguage()
  const faqs = lang === 'de' ? FAQ_DE : FAQ_EN
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-800 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">
            {lang === 'de' ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-brand-100 text-lg">
            {lang === 'de' ? 'Finden Sie schnell Antworten auf Ihre Fragen.' : 'Find quick answers to your questions.'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {faqs.map(section => (
          <div key={section.cat}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{section.cat}</h2>
            <div className="space-y-2">
              {section.items.map(item => {
                const key = section.cat + item.q
                const isOpen = open === key
                return (
                  <div key={key} className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{item.q}</span>
                      <span className={`ml-4 text-brand-800 transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                        <p className="pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-4">
            {lang === 'de' ? 'Haben Sie noch weitere Fragen?' : 'Still have questions?'}
          </p>
          <Link href="/contact" className="inline-block bg-brand-800 hover:bg-brand-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
            {lang === 'de' ? 'Kontakt aufnehmen' : 'Get in touch'}
          </Link>
        </div>
      </div>
    </div>
  )
}
