'use client'
import { useLanguage } from '@/components/ClientLayout'
import LegalLayout from '@/components/LegalLayout'

export default function Imprint() {
  const { lang } = useLanguage()

  const de = (
    <>
      <h1>Impressum</h1>

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        Attireburg<br />
        Rechtsform: Einzelunternehmen<br />
        Inhaber: Khadija Tehami<br />
        Im Gewerbepark C25<br />
        93059 Regensburg, Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a><br />
        Telefon: +49-152-5415-8548
      </p>

      <h2>Umsatzsteuer-Identifikationsnummer</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
        DE 455 977 446
      </p>

      <h2>Verantwortlicher i.S.d. § 18 Abs. 2 MStV</h2>
      <p>
        Khadija Tehami<br />
        Im Gewerbepark C25<br />
        93059 Regensburg
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        sind wir nicht verpflichtet und nicht bereit.
      </p>
    </>
  )

  const en = (
    <>
      <h1>Legal Notice (Imprint)</h1>

      <h2>Information according to § 5 TMG</h2>
      <p>
        Attireburg<br />
        Legal form: Sole proprietorship<br />
        Owner: Khadija Tehami<br />
        Im Gewerbepark C25<br />
        93059 Regensburg, Germany
      </p>

      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:kontakt@attireburg.de">kontakt@attireburg.de</a><br />
        Telephone: +49-152-5415-8548
      </p>

      <h2>VAT Identification Number</h2>
      <p>
        VAT identification number according to § 27a UStG:<br />
        DE 455 977 446
      </p>

      <h2>Responsible party within the meaning of Section 18 Paragraph 2 MStV</h2>
      <p>
        Khadija Tehami<br />
        Im Gewerbepark C25<br />
        93059 Regensburg
      </p>

      <h2>EU Dispute Resolution</h2>
      <p>
        The European Commission provides a platform for online dispute resolution (ODR):{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>

      <h2>Consumer Dispute Resolution</h2>
      <p>
        We are neither obligated nor willing to participate in dispute resolution proceedings
        before a consumer arbitration board.
      </p>
    </>
  )

  return (
    <LegalLayout updatedDate="2025" pageId="imprint">
      {lang === 'de' ? de : en}
    </LegalLayout>
  )
}
