'use client'
import { useLanguage } from '@/components/ClientLayout'
import LegalLayout from '@/components/LegalLayout'

export default function Terms() {
  const { lang } = useLanguage()

  const de = (
    <>
      <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>

      <h2>Allgemeine Bestimmungen &amp; Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Geschäftsbeziehung zwischen
        Attireburg (nachfolgend „Attireburg") und dem Kunden (nachfolgend „Kunde"). Mit Aufgabe
        einer Bestellung erklärt sich der Kunde mit diesen Bedingungen einverstanden. Der Vertrag
        kommt mit der Bestellbestätigung zustande.
      </p>

      <h2>Sprache</h2>
      <p>
        Die AGB werden in derselben Sprache(n) bereitgestellt, die auch auf der Attireburg-Website
        verwendet wird. Sowohl deutsche als auch englische Fassungen können zur Verfügung gestellt
        werden; im Falle von Abweichungen gilt die deutsche Fassung.
      </p>

      <h2>Vertragsschluss</h2>
      <p>
        Ein Vertrag zwischen Attireburg und dem Kunden kommt erst zustande, wenn Attireburg die
        Bestellung bestätigt. Warenkorbinhalte und Produktdarstellungen stellen bis zur Bestätigung
        unverbindliche Angebote dar.
      </p>

      <h2>Preise &amp; Zahlung</h2>
      <p>
        Alle von Attireburg angegebenen Preise verstehen sich einschließlich Mehrwertsteuer, sofern
        nicht anders angegeben. Versandkosten werden vor Abschluss des Bestellvorgangs separat
        ausgewiesen. Die von Attireburg akzeptierten Zahlungsmethoden werden während des
        Bestellprozesses angegeben. Der Kunde ist verpflichtet, die Zahlung innerhalb der
        vorgegebenen Frist zu leisten.
      </p>

      <h2>Lieferung &amp; Versand</h2>
      <p>
        Attireburg liefert an die vom Kunden angegebene Lieferadresse. Lieferzeiten und -kosten
        werden vor Abschluss des Bestellvorgangs mitgeteilt. Bei Verzögerungen wird Attireburg den
        Kunden unverzüglich informieren.
      </p>

      <h2>Widerrufsrecht &amp; Rücksendungen</h2>
      <p>
        Gemäß deutschem Fernabsatzrecht (§ 312d BGB) hat der Kunde ein gesetzliches Widerrufsrecht
        von 14 Tagen. Soweit von Attireburg Abonnementverträge angeboten werden, wird ein klar
        gekennzeichneter Button „Vertrag hier kündigen" gemäß § 312k BGB bereitgestellt.
      </p>

      <h2>Haftung</h2>
      <p>
        Attireburg haftet unbeschränkt für Vorsatz, grobe Fahrlässigkeit, Verletzung von Leben,
        Körper oder Gesundheit sowie für Garantien und gesetzliche Ansprüche (z. B. nach dem
        Produkthaftungsgesetz). Bei Verletzung wesentlicher Vertragspflichten durch einfache
        Fahrlässigkeit ist die Haftung von Attireburg auf den typischerweise vorhersehbaren Schaden
        beschränkt. Eine weitergehende Haftung ist ausgeschlossen.
      </p>

      <h2>Eigentumsvorbehalt</h2>
      <p>
        Die Ware bleibt bis zur vollständigen Bezahlung des Kaufpreises durch den Kunden Eigentum
        von Attireburg.
      </p>

      <h2>Vertraulichkeit &amp; Geschäftsgeheimnisse</h2>
      <p>
        Attireburg und der Kunde verpflichten sich, vertrauliche, nicht öffentliche
        Geschäftsinformationen mit Sorgfalt zu behandeln. Diese Verpflichtung gilt auch nach
        Beendigung der Vertragsbeziehung fort.
      </p>

      <h2>Anwendbares Recht</h2>
      <p>
        Alle Verträge mit Attireburg unterliegen deutschem Recht. Verbraucherschutzrechte, die im
        Wohnsitzland des Kunden gelten, bleiben hiervon unberührt.
      </p>
    </>
  )

  const en = (
    <>
      <h1>General Terms and Conditions (GTC)</h1>

      <h2>General Provisions &amp; Scope</h2>
      <p>
        These General Terms and Conditions (GTC) govern the business relationship between
        Attireburg (hereinafter "Attireburg") and the customer (hereinafter "Customer"). By placing
        an order, the Customer agrees to these terms and conditions. The contract is concluded upon
        order confirmation.
      </p>

      <h2>Language</h2>
      <p>
        The terms and conditions are provided in the same language(s) used on the Attireburg
        website. Both German and English versions may be provided; in case of discrepancies, the
        German version shall prevail.
      </p>

      <h2>Conclusion of Contract</h2>
      <p>
        A contract between Attireburg and the customer is only concluded when Attireburg confirms
        the order. Shopping cart contents and product descriptions constitute non-binding offers
        until confirmation.
      </p>

      <h2>Prices &amp; Payment</h2>
      <p>
        All prices quoted by Attireburg include VAT unless otherwise stated. Shipping costs are
        shown separately before the order is completed. The payment methods accepted by Attireburg
        are displayed during the order process. The customer is obligated to make payment within
        the specified timeframe.
      </p>

      <h2>Delivery &amp; Shipping</h2>
      <p>
        Attireburg delivers to the delivery address provided by the customer. Delivery times and
        costs are communicated before the order is completed. In case of delays, Attireburg will
        inform the customer immediately.
      </p>

      <h2>Right of Withdrawal &amp; Returns</h2>
      <p>
        According to German distance selling law (§ 312d BGB), the customer has a statutory right
        of withdrawal of 14 days. Where Attireburg offers subscription contracts, a clearly marked
        "Cancel contract here" button is provided in accordance with § 312k BGB.
      </p>

      <h2>Liability</h2>
      <p>
        Attireburg is liable without limitation for intent, gross negligence, injury to life, body
        or health, as well as for guarantees and statutory claims (e.g., under the Product
        Liability Act). In the event of a breach of essential contractual obligations due to simple
        negligence, Attireburg's liability is limited to the typically foreseeable damage. Any
        further liability is excluded.
      </p>

      <h2>Retention of Title</h2>
      <p>
        The goods remain the property of Attireburg until the customer has paid the purchase
        price in full.
      </p>

      <h2>Confidentiality &amp; Trade Secrets</h2>
      <p>
        Attireburg and the customer agree to treat confidential, non-public business information
        with care. This obligation continues even after the termination of the contractual
        relationship.
      </p>

      <h2>Applicable Law</h2>
      <p>
        All contracts with Attireburg are subject to German law. Consumer protection rights
        applicable in the customer's country of residence remain unaffected.
      </p>
    </>
  )

  return (
    <LegalLayout updatedDate="2025" pageId="terms">
      {lang === 'de' ? de : en}
    </LegalLayout>
  )
}
