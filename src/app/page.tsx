'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  onSale: boolean
  category: string
}

export default function Home() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?limit=8')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const categories = [
    { label: lang === 'de' ? 'Alle' : 'All', href: '/products' },
    { label: lang === 'de' ? 'Pullover' : 'Sweaters', href: '/products?category=pullover' },
    { label: lang === 'de' ? 'Jacken' : 'Jackets', href: '/products?category=jacken' },
    { label: 'Hoodies', href: '/products?category=hoodies' },
    { label: 'Shirts', href: '/products?category=shirts' },
    { label: 'Sale', href: '/products?onSale=true' },
  ]

  const trustItems = lang === 'de' ? [
    { icon: '🚚', title: 'Kostenloser Versand', sub: 'Ab 50 € Bestellwert' },
    { icon: '↩️', title: '30 Tage Rückgabe', sub: 'Kostenlos & einfach' },
    { icon: '🔒', title: 'Sicher bezahlen', sub: 'PayPal, Karte & mehr' },
    { icon: '⭐', title: 'Premium Qualität', sub: 'Handgefertigt in DE' },
  ] : [
    { icon: '🚚', title: 'Free Shipping', sub: 'From €50 order value' },
    { icon: '↩️', title: '30-Day Returns', sub: 'Free & easy' },
    { icon: '🔒', title: 'Secure Payment', sub: 'PayPal, card & more' },
    { icon: '⭐', title: 'Premium Quality', sub: 'Handcrafted in Germany' },
  ]

  const reviews = [
    { name: 'Maria Kaufmann', city: 'München', initials: 'MK', text: lang === 'de' ? '"Die Qualität ist außergewöhnlich. Mein Pullover sieht auch nach zwei Jahren noch aus wie neu. Definitiv jeden Euro wert!"' : '"The quality is exceptional. My sweater still looks brand new after two years. Definitely worth every euro!"' },
    { name: 'Thomas Schmidt', city: 'Hamburg', initials: 'TS', text: lang === 'de' ? '"Endlich eine Marke, die hält was sie verspricht. Der Kundenservice ist erstklassig und die Lieferung war blitzschnell."' : '"Finally a brand that delivers on its promises. Customer service is top-notch and delivery was lightning fast."' },
    { name: 'Lisa Weber', city: 'Berlin', initials: 'LW', text: lang === 'de' ? '"Ich bin begeistert von der Passform und dem Design. Diese Jacke ist ein echter Hingucker und super bequem zu tragen."' : '"I am thrilled with the fit and design. This jacket is a real eye-catcher and super comfortable to wear."' },
  ]

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="relative w-full h-[80vh] min-h-[500px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2070&q=80"
          alt="Attireburg Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-white/70 text-xs tracking-[0.25em] uppercase mb-4">
            {lang === 'de' ? 'Neue Kollektion 2026' : 'New Collection 2026'}
          </p>
          <h1 className="text-white text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-2xl leading-tight">
            {lang === 'de' ? 'Premium Deutsche Kleidung' : 'Premium German Clothing'}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products" className="bg-white text-gray-900 text-sm font-semibold px-8 py-3 hover:bg-gray-100 transition-colors">
              {lang === 'de' ? 'Jetzt shoppen' : 'Shop Now'}
            </Link>
            <Link href="/customize" className="border border-white text-white text-sm font-semibold px-8 py-3 hover:bg-white/10 transition-colors">
              Print on Demand
            </Link>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto gap-0">
            {categories.map(c => (
              <Link key={c.label} href={c.href} className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-900 transition-colors">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            {lang === 'de' ? 'Unsere Kollektion' : 'Our Collection'}
          </h2>
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            {lang === 'de' ? 'Alle anzeigen →' : 'View all →'}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-100 mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => {
              const name = lang === 'de' ? product.name : (product.nameEn || product.name)
              const pct = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0
              return (
                <Link key={product.id} href={`/products/${product.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-3">
                    {product.images[0] && (
                      <img src={product.images[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {product.onSale && pct > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 tracking-wide">
                        SAVE {pct}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-semibold text-red-600">{fmt(product.salePrice)}</span>
                        <span className="text-xs text-gray-400 line-through">{fmt(product.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-700">{fmt(product.price)}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Print on Demand banner */}
      <section style={{ backgroundColor: '#1a1214' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">
              {lang === 'de' ? 'Individuell & Einzigartig' : 'Individual & Unique'}
            </p>
            <h2 className="text-3xl font-bold mb-3">Print on Demand</h2>
            <p className="text-gray-400 max-w-md text-sm leading-relaxed">
              {lang === 'de'
                ? 'Gestalten Sie Ihre eigene Kleidung — für Privatpersonen und Unternehmen. Ihr Design auf Premium-Qualität.'
                : 'Design your own clothing — for individuals and businesses. Your design on premium quality.'}
            </p>
          </div>
          <Link href="/customize" className="shrink-0 bg-white text-gray-900 text-sm font-semibold px-8 py-3 hover:bg-gray-100 transition-colors">
            {lang === 'de' ? 'Jetzt anfragen' : 'Request now'}
          </Link>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">
              {lang === 'de' ? 'Was unsere Kunden sagen' : 'What our customers say'}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span className="text-yellow-400">★★★★★</span>
              <span>4.8 / 5</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map(r => (
              <div key={r.name} className="bg-white border border-gray-200 p-6">
                <div className="flex text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-800 text-white rounded-full flex items-center justify-center text-xs font-bold">{r.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {trustItems.map(item => (
              <div key={item.title}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
