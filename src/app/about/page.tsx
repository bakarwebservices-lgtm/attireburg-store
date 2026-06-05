'use client'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'

export default function About() {
  const { lang } = useLanguage()

  const pillars = lang === 'de' ? [
    {
      icon: '🏗️',
      title: 'Handwerkskunst',
      desc: 'Jedes Stück wird mit höchster Sorgfalt gefertigt — von der Auswahl der Materialien bis zum letzten Stich.'
    },
    {
      icon: '♾️',
      title: 'Zeitlosigkeit',
      desc: 'Wir jagen keinen Trends. Wir schaffen Identität — Designs, die heute wie morgen stehen.'
    },
    {
      icon: '🎯',
      title: 'Design-Integrität',
      desc: 'Jedes Detail hat seinen Grund. Kein Überfluss, kein Kompromiss — nur ehrliches Design.'
    },
    {
      icon: '🌿',
      title: 'Qualität & Beständigkeit',
      desc: 'Premium-Materialien, die nicht nur gut aussehen, sondern jahrelang halten.'
    },
  ] : [
    {
      icon: '🏗️',
      title: 'Craftsmanship',
      desc: 'Every piece is made with the utmost care — from material selection to the final stitch.'
    },
    {
      icon: '♾️',
      title: 'Timelessness',
      desc: 'We don\'t chase trends. We create identity — designs that stand today as much as tomorrow.'
    },
    {
      icon: '🎯',
      title: 'Design Integrity',
      desc: 'Every detail has a purpose. No excess, no compromise — just honest design.'
    },
    {
      icon: '🌿',
      title: 'Quality & Durability',
      desc: 'Premium materials that not only look great but last for years.'
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="relative min-h-[65vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=2070&q=80"
            alt="Attireburg"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900 bg-opacity-65" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
          <p className="text-brand-200 text-xs tracking-[0.25em] uppercase mb-4">
            {lang === 'de' ? 'Gegründet in Regensburg, Deutschland' : 'Founded in Regensburg, Germany'}
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            {lang === 'de' ? 'Mehr als Mode.' : 'More than fashion.'}
            <br />
            <span className="text-brand-300">{lang === 'de' ? 'Eine Bewegung.' : 'A movement.'}</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {lang === 'de'
              ? 'An der Schnittstelle von Handwerkskunst und moderner Eleganz geboren — Attireburg ist eine Bewegung für verfeinerte Schlichtheit.'
              : 'Born at the intersection of craftsmanship and modern elegance — Attireburg is a movement for refined simplicity.'}
          </p>
        </div>
      </div>

      {/* Brand statement */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-brand-800 font-semibold mb-4">
                {lang === 'de' ? 'Unsere Geschichte' : 'Our Story'}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                {lang === 'de'
                  ? 'Wahre Stil ist stille Zuversicht'
                  : 'True style is quiet confidence'}
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                {lang === 'de' ? (
                  <>
                    <p>Wir glauben, dass wahre Eleganz leise ist: zeitlos, mühelos und bedeutungsvoll. Gegründet in Regensburg, Deutschland, vereint Attireburg außergewöhnlichen Komfort mit zurückhaltendem Luxus.</p>
                    <p>Von maßgeschneiderten Hoodies und weichen Sweatshirts bis hin zu sorgfältig gefertigten Outerwear-Designs — jedes Detail spiegelt unsere Leidenschaft für Qualität, Langlebigkeit und Designintegrität wider.</p>
                    <p>Das Attireburg-Brücken-Emblem steht für unsere Philosophie: die Verschmelzung von Tradition und Moderne, von Komfort und Klasse. Wir jagen keine Trends. Wir schaffen Identität.</p>
                    <p className="font-medium text-gray-900 italic">"Bei Attireburg trägt man mehr als Stoff — man trägt Attireburg."</p>
                  </>
                ) : (
                  <>
                    <p>We believe that true style is quiet confidence: timeless, effortless, and meaningful. Founded in Regensburg, Germany, Attireburg combines exceptional comfort with understated luxury.</p>
                    <p>From tailored hoodies and soft sweatshirts to meticulously crafted outerwear designs, every detail reflects our passion for quality, durability, and design integrity.</p>
                    <p>The Attireburg bridge emblem represents our philosophy: the fusion of tradition and modernity, of comfort and class. We don't chase trends; we create identity.</p>
                    <p className="font-medium text-gray-900 italic">"At Attireburg, you wear more than fabric — you wear Attireburg."</p>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80"
                alt="Attireburg craftsmanship"
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-lg shadow-xl border-l-4 border-brand-800">
                <div className="text-2xl font-bold text-brand-800">Regensburg</div>
                <div className="text-sm text-gray-500">{lang === 'de' ? 'Deutschland · Gegründet' : 'Germany · Founded'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Four pillars */}
      <div className="bg-gray-50 py-20 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-brand-800 font-semibold mb-3">
              {lang === 'de' ? 'Was uns antreibt' : 'What drives us'}
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              {lang === 'de' ? 'Vier Säulen, eine Identität' : 'Four pillars, one identity'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(p => (
              <div key={p.title} className="bg-white rounded-lg p-7 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manifesto pull-quote */}
      <div style={{ backgroundColor: '#1a1214' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-brand-300 text-xs tracking-[0.25em] uppercase mb-8">
            {lang === 'de' ? 'Unser Versprechen' : 'Our promise'}
          </p>
          <blockquote className="text-2xl sm:text-3xl font-light text-white leading-relaxed italic">
            {lang === 'de'
              ? '"Ob in Bewegung oder in Ruhe: Sie tragen mehr als Stoff — Sie tragen Attireburg."'
              : '"Whether in motion or at rest: you wear more than fabric — you wear Attireburg."'}
          </blockquote>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-brand-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {lang === 'de' ? 'Erleben Sie Attireburg' : 'Experience Attireburg'}
          </h2>
          <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
            {lang === 'de'
              ? 'Entdecken Sie unsere Kollektion und finden Sie Ihr Statement-Stück.'
              : 'Discover our collection and find your statement piece.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products" className="inline-block bg-white text-brand-800 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              {lang === 'de' ? 'Kollektion entdecken' : 'Explore Collection'}
            </Link>
            <Link href="/contact" className="inline-block border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              {lang === 'de' ? 'Kontakt aufnehmen' : 'Get in touch'}
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
