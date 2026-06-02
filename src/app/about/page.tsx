'use client'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function About() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=2070&q=80"
            alt="Attireburg Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900 bg-opacity-60" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">{t.about.title}</h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">{t.about.subtitle}</p>
        </div>
      </div>

      {/* Story */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.about.story.title}</h2>
              <div className="space-y-4 text-gray-700">
                {t.about.story.content.map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80"
                alt="Unser Atelier"
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-lg shadow-xl border-l-4 border-brand-800">
                <div className="text-2xl font-bold text-brand-800">2010</div>
                <div className="text-sm text-gray-600">{lang === 'de' ? 'Gegründet' : 'Founded'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-gray-50 py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.about.values.title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t.about.values.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {([
              { key: 'quality', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { key: 'sustainability', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { key: 'innovation', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ] as const).map(({ key, icon }) => {
              const val = t.about.values[key] as { title: string; description: string }
              return (
                <div key={key} className="text-center">
                  <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{val.title}</h3>
                  <p className="text-gray-600">{val.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.about.team.title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t.about.team.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { name: 'Anna Schmidt', role: lang === 'de' ? 'Gründerin & Designerin' : 'Founder & Designer', img: 'photo-1494790108755-2616b612b786', desc: lang === 'de' ? 'Mit über 15 Jahren Erfahrung in der Modebranche leitet Anna unser Designteam.' : 'With over 15 years in fashion, Anna leads our design team.' },
              { name: 'Michael Weber', role: lang === 'de' ? 'Produktionsleiter' : 'Production Manager', img: 'photo-1472099645785-5658abf4ff4e', desc: lang === 'de' ? 'Michael sorgt dafür, dass jedes Produkt unseren hohen Qualitätsstandards entspricht.' : 'Michael ensures every product meets our high quality standards.' },
              { name: 'Sarah Klein', role: lang === 'de' ? 'Qualitätskontrolle' : 'Quality Control', img: 'photo-1438761681033-6461ffad8d80', desc: lang === 'de' ? 'Sarah prüft jedes Detail und stellt sicher, dass nur Perfektion unser Haus verlässt.' : 'Sarah checks every detail to ensure only perfection leaves our house.' },
            ].map((member, i) => (
              <div key={i} className="text-center">
                <img
                  src={`https://images.unsplash.com/${member.img}?auto=format&fit=crop&w=400&q=80`}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-brand-800 font-medium mb-2 text-sm">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-brand-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t.about.contact.title}</h2>
          <p className="text-brand-100 mb-8 max-w-2xl mx-auto">{t.about.contact.subtitle}</p>
          <Link href="/contact" className="inline-block bg-white text-brand-800 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            {t.about.contact.button}
          </Link>
        </div>
      </div>
    </div>
  )
}
