'use client'
import { useLanguage } from '@/components/ClientLayout'
import LegalLayout from '@/components/LegalLayout'

export default function Privacy() {
  const { lang } = useLanguage()

  const de = (
    <>
      <h1>Datenschutzerklärung</h1>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist:<br /><br />
        Attireburg<br />
        Inhaber: Khadija Tehami<br />
        Im Gewerbepark C25, 93059 Regensburg, Deutschland<br />
        E-Mail: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a>
      </p>

      <h2>Erhebung personenbezogener Daten</h2>
      <p>
        Attireburg erhebt und verarbeitet personenbezogene Daten nur, soweit dies für folgende
        Zwecke erforderlich ist:
      </p>
      <ul>
        <li>Bearbeitung und Erfüllung von Bestellungen</li>
        <li>Bereitstellung von Kundensupport</li>
        <li>Betrieb, Sicherheit und Optimierung der Website</li>
        <li>Marketingmaßnahmen (nur mit ausdrücklicher Einwilligung)</li>
      </ul>
      <p>
        Verarbeitete Daten können insbesondere sein: Name, Rechnungs- und Lieferadresse,
        E-Mail-Adresse, Telefonnummer, Zahlungsdaten sowie IP-Adresse.
      </p>

      <h2>Rechtsgrundlage der Verarbeitung</h2>
      <p>Attireburg verarbeitet personenbezogene Daten in Übereinstimmung mit Art. 6 DSGVO:</p>
      <ul>
        <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
        <li>Rechtliche Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO)</li>
        <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</li>
        <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
      </ul>

      <h2>Cookies &amp; Tracking</h2>
      <p>
        Diese Website verwendet Cookies, um grundlegende Funktionen sicherzustellen und die
        Nutzererfahrung zu verbessern. Analyse- oder Marketing-Cookies werden nur nach
        vorheriger Einwilligung eingesetzt.
      </p>
      <p>
        Cookies können jederzeit über die Einstellungen des Browsers eingeschränkt oder
        deaktiviert werden.
      </p>

      <h2>Einsatz von Drittanbieterdiensten</h2>
      <p>
        Zur Abwicklung von Zahlungen, Versand und Analyse können personenbezogene Daten an
        sorgfältig ausgewählte Dienstleister übermittelt werden, z. B.:
      </p>
      <ul>
        <li>Zahlungsanbieter (z. B. PayPal, Stripe)</li>
        <li>Versanddienstleister (z. B. DHL, FedEx)</li>
        <li>Analyse-Tools (z. B. Google Analytics)</li>
      </ul>
      <p>Diese Dienstleister sind vertraglich zur Einhaltung der DSGVO verpflichtet.</p>

      <h2>Datenspeicherung &amp; Aufbewahrung</h2>
      <p>
        Personenbezogene Daten werden nur so lange gespeichert, wie es zur Erfüllung
        vertraglicher Verpflichtungen oder zur Einhaltung gesetzlicher Anforderungen
        erforderlich ist (z. B. steuerliche Aufbewahrungspflichten nach AO/HGB in Deutschland).
      </p>

      <h2>Rechte der Kunden</h2>
      <p>Kunden haben folgende Rechte gemäß DSGVO:</p>
      <ul>
        <li>Auskunftsrecht (Art. 15)</li>
        <li>Recht auf Berichtigung (Art. 16)</li>
        <li>Recht auf Löschung (Art. 17)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20)</li>
        <li>Widerspruchsrecht (Art. 21)</li>
        <li>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3)</li>
      </ul>
      <p>
        Zur Ausübung dieser Rechte können Kunden Attireburg über die oben genannten
        Kontaktdaten erreichen.
      </p>

      <h2>Datensicherheit</h2>
      <p>
        Attireburg verwendet SSL-Verschlüsselung und branchenübliche Sicherheitsmaßnahmen,
        um personenbezogene Daten vor unbefugtem Zugriff, Verlust oder Missbrauch zu schützen.
      </p>

      <h2>Aufsichtsbehörde</h2>
      <p>
        Kunden können Beschwerden bei ihrer örtlichen Aufsichtsbehörde einreichen. In
        Deutschland ist dies das Bayerische Landesamt für Datenschutzaufsicht (BayLDA).
      </p>
    </>
  )

  const en = (
    <>
      <h1>Data Privacy Statement</h1>

      <h2>Controller / Responsible Party</h2>
      <p>
        The controller responsible for the processing of personal data on this website is:<br /><br />
        Attireburg<br />
        Owner: Khadija Tehami<br />
        Im Gewerbepark C25, 93059 Regensburg, Germany<br />
        Email: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a>
      </p>

      <h2>Collection of Personal Data</h2>
      <p>
        Attireburg collects and processes personal data only to the extent necessary for
        the following purposes:
      </p>
      <ul>
        <li>Processing and fulfilling orders</li>
        <li>Provision of customer support</li>
        <li>Operation, security and optimization of the website</li>
        <li>Marketing activities (only with explicit consent)</li>
      </ul>
      <p>
        Data processed may include, in particular: name, billing and delivery address,
        email address, telephone number, payment details and IP address.
      </p>

      <h2>Legal Basis for Processing</h2>
      <p>Attireburg processes personal data in accordance with Article 6 GDPR:</p>
      <ul>
        <li>Contract performance (Art. 6 para. 1 lit. b GDPR)</li>
        <li>Legal obligations (Art. 6 para. 1 lit. c GDPR)</li>
        <li>Legitimate interests (Art. 6 para. 1 lit. f GDPR)</li>
        <li>Consent (Art. 6 para. 1 lit. a GDPR)</li>
      </ul>

      <h2>Cookies &amp; Tracking</h2>
      <p>
        This website uses cookies to ensure basic functionality and improve the user
        experience. Analytics or marketing cookies are only used with your prior consent.
      </p>
      <p>Cookies can be restricted or disabled at any time via the browser settings.</p>

      <h2>Use of Third-Party Services</h2>
      <p>
        For processing payments, shipping and analysis, personal data may be transferred
        to carefully selected service providers, e.g.:
      </p>
      <ul>
        <li>Payment providers (e.g. PayPal, Stripe)</li>
        <li>Shipping service providers (e.g. DHL, FedEx)</li>
        <li>Analysis tools (e.g. Google Analytics)</li>
      </ul>
      <p>These service providers are contractually obligated to comply with the GDPR.</p>

      <h2>Data Storage &amp; Retention</h2>
      <p>
        Personal data is stored only as long as is necessary to fulfill contractual obligations
        or to comply with legal requirements (e.g. tax retention obligations according to
        AO/HGB in Germany).
      </p>

      <h2>Customer Rights</h2>
      <p>Customers have the following rights under the GDPR:</p>
      <ul>
        <li>Right to information (Art. 15)</li>
        <li>Right to rectification (Art. 16)</li>
        <li>Right to erasure (Art. 17)</li>
        <li>Right to restriction of processing (Art. 18)</li>
        <li>Right to data portability (Art. 20)</li>
        <li>Right to object (Art. 21)</li>
        <li>Right to withdraw consent (Art. 7 para. 3)</li>
      </ul>
      <p>
        To exercise these rights, customers can contact Attireburg using the contact
        details provided above.
      </p>

      <h2>Data Security</h2>
      <p>
        Attireburg uses SSL encryption and industry-standard security measures to protect
        personal data from unauthorized access, loss, or misuse.
      </p>

      <h2>Supervisory Authority</h2>
      <p>
        Customers can file complaints with their local supervisory authority. In Germany,
        this is the Bavarian State Office for Data Protection Supervision (BayLDA).
      </p>
    </>
  )

  return (
    <LegalLayout updatedDate="2025" pageId="privacy">
      {lang === 'de' ? de : en}
    </LegalLayout>
  )
}
