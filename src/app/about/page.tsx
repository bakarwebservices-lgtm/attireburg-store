'use client'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function About() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Attireburg Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-900 bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Über Attireburg
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Seit über einem Jahrzehnt stehen wir für kompromisslose Qualität und zeitloses Design. 
            Jedes Kleidungsstück erzählt eine Geschichte von Handwerkskunst und Leidenschaft.
          </p>
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
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Unser Atelier"
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-xl border-l-4 border-primary-600">
                <div className="text-2xl font-bold text-primary-800">2010</div>
                <div className="text-sm text-gray-600">Gegründet</div>
              </div>
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
              { 
                name: 'Anna Schmidt', 
                role: 'Gründerin & Designerin', 
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                description: 'Mit über 15 Jahren Erfahrung in der Modebranche leitet Anna unser Designteam.'
              },
              { 
                name: 'Michael Weber', 
                role: 'Produktionsleiter', 
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                description: 'Michael sorgt dafür, dass jedes Produkt unseren hohen Qualitätsstandards entspricht.'
              },
              { 
                name: 'Sarah Klein', 
                role: 'Qualitätskontrolle', 
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                description: 'Sarah prüft jedes Detail und stellt sicher, dass nur Perfektion unser Haus verlässt.'
              }
            ].map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                  />
                  <div className="absolute inset-0 rounded-full bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
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