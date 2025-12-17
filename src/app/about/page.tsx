'use client'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function About() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-800 mb-6">
              Über Attireburg
            </h1>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Premium deutsche Kleidung für höchste Ansprüche. Seit Jahren verbinden wir zeitloses Design mit erstklassiger Qualität.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Unsere Geschichte
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Attireburg wurde mit der Vision gegründet, hochwertige deutsche Kleidung zu schaffen, 
                  die sowohl zeitlos als auch modern ist. Unser Fokus liegt auf Pullovern und Jacken, 
                  die nicht nur gut aussehen, sondern auch jahrelang halten.
                </p>
                <p>
                  Jedes unserer Produkte wird mit größter Sorgfalt und Aufmerksamkeit für Details 
                  hergestellt. Wir arbeiten nur mit den besten Materialien und erfahrenen Handwerkern 
                  zusammen, um sicherzustellen, dass jedes Kleidungsstück unseren hohen Standards entspricht.
                </p>
                <p>
                  Nachhaltigkeit und Qualität stehen im Mittelpunkt unserer Philosophie. Wir glauben 
                  daran, weniger, aber dafür bessere Kleidung zu produzieren, die unseren Kunden 
                  jahrelang Freude bereitet.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-primary-400 text-lg">Unser Atelier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Unsere Werte
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Diese Prinzipien leiten uns bei allem, was wir tun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualität</h3>
              <p className="text-gray-600">
                Wir verwenden nur die besten Materialien und arbeiten mit erfahrenen Handwerkern zusammen.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nachhaltigkeit</h3>
              <p className="text-gray-600">
                Umweltbewusstes Handeln und nachhaltige Produktion sind für uns selbstverständlich.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Wir verbinden traditionelle Handwerkskunst mit modernen Designs und Technologien.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Unser Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Leidenschaftliche Menschen, die jeden Tag daran arbeiten, Ihnen die beste Kleidung zu bieten
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Anna Schmidt', role: 'Gründerin & Designerin', image: null },
              { name: 'Michael Weber', role: 'Produktionsleiter', image: null },
              { name: 'Sarah Klein', role: 'Qualitätskontrolle', image: null }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-400">Foto</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Haben Sie Fragen?
          </h2>
          <p className="text-primary-200 mb-8 max-w-2xl mx-auto">
            Wir freuen uns darauf, von Ihnen zu hören. Kontaktieren Sie uns für weitere Informationen 
            über unsere Produkte oder unser Unternehmen.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-primary-800 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </div>
  )
}