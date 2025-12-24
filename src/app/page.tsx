'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { translations } from '@/lib/translations'
import { useLanguage } from '@/components/ClientLayout'
import { formatPriceWithVAT } from '@/lib/vat'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  avgRating: number
  reviewCount: number
  onSale: boolean
}

export default function Home() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=3')
      const data = await response.json()
      setFeaturedProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Premium clothing store interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Premium Deutsche
            <span className="block text-primary-300">Kleidung</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">
            Zeitloses Design trifft auf erstklassige Qualität. Entdecken Sie unsere exklusive Kollektion von Pullovern und Jacken.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Kollektion entdecken
            </Link>
            <Link
              href="/about"
              className="inline-block border-2 border-white text-white hover:bg-white hover:text-primary-800 font-semibold px-8 py-4 rounded-lg transition-all"
            >
              Unsere Geschichte
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary-800 mb-6">
                Deutsche Handwerkskunst
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Seit über einem Jahrzehnt stehen wir für kompromisslose Qualität und zeitloses Design. 
                Jedes unserer Kleidungsstücke wird mit größter Sorgfalt und Liebe zum Detail gefertigt.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Von der Auswahl der feinsten Materialien bis zur finalen Qualitätskontrolle – 
                bei Attireburg wird jeder Schritt mit Präzision und Leidenschaft ausgeführt.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
              >
                Mehr über uns erfahren
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Handwerkskunst bei der Arbeit"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary-600 text-white p-6 rounded-lg shadow-xl">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm">Jahre Erfahrung</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-800 mb-4">
              Unsere Bestseller
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Entdecken Sie unsere beliebtesten Stücke, die für ihre außergewöhnliche Qualität und zeitloses Design geschätzt werden.
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-50 rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-primary-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-primary-200 rounded mb-2"></div>
                    <div className="h-4 bg-primary-200 rounded mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-20 bg-primary-200 rounded"></div>
                      <div className="h-10 w-32 bg-primary-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="group bg-primary-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center relative overflow-hidden">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={lang === 'de' ? product.name : product.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-primary-400 text-lg">Kein Bild</span>
                        )}
                        {product.onSale && (
                          <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                            Sale
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-800 mb-2">
                          {lang === 'de' ? product.name : product.nameEn}
                        </h3>
                        <div className="flex items-center mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.avgRating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              ({product.reviewCount})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="space-y-1">
                              {product.onSale && product.salePrice ? (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-red-600">
                                      {formatPriceWithVAT(product.salePrice, lang).price}
                                    </span>
                                    <span className="text-lg text-gray-500 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {formatPriceWithVAT(product.salePrice, lang).vatInfo}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold text-primary-700">
                                    {formatPriceWithVAT(product.price, lang).price}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {formatPriceWithVAT(product.price, lang).vatInfo}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors">
                            {t.products.addToCart}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-primary-600 text-lg">{t.home.noFeaturedProducts}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quality Showcase Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-800 mb-4">
              Warum Attireburg?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Drei Säulen, die unsere Marke definieren
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Premium Materialien"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-4">Premium Materialien</h3>
              <p className="text-gray-600 leading-relaxed">
                Nur die feinsten Stoffe und Materialien finden ihren Weg in unsere Kollektion. 
                Jedes Material wird sorgfältig ausgewählt und geprüft.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Handwerkskunst"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-4">Meisterhafte Verarbeitung</h3>
              <p className="text-gray-600 leading-relaxed">
                Erfahrene Schneider und Handwerker bringen jahrzehntelange Expertise in jedes 
                einzelne Kleidungsstück ein.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <img
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Zeitloses Design"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-4">Zeitloses Design</h3>
              <p className="text-gray-600 leading-relaxed">
                Unsere Designs überdauern Trends und Moden. Klassische Eleganz trifft auf 
                moderne Funktionalität.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-6 bg-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-800 mb-4">
              Was unsere Kunden sagen
            </h2>
            <p className="text-xl text-gray-600">
              Echte Bewertungen von zufriedenen Kunden
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Die Qualität ist außergewöhnlich. Mein Pullover sieht auch nach zwei Jahren noch aus wie neu. 
                Definitiv jeden Euro wert!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">MK</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Kaufmann</div>
                  <div className="text-gray-600 text-sm">München</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Endlich eine Marke, die hält was sie verspricht. Der Kundenservice ist erstklassig und 
                die Lieferung war blitzschnell."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">TS</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Thomas Schmidt</div>
                  <div className="text-gray-600 text-sm">Hamburg</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Ich bin begeistert von der Passform und dem Design. Diese Jacke ist ein echter Hingucker 
                und super bequem zu tragen."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">LW</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa Weber</div>
                  <div className="text-gray-600 text-sm">Berlin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-6 bg-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Bleiben Sie informiert
          </h2>
          <p className="text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
            Erhalten Sie exklusive Einblicke in neue Kollektionen, besondere Angebote und 
            die neuesten Nachrichten aus unserem Atelier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-gray-900"
            />
            <button className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-lg transition-colors font-semibold whitespace-nowrap">
              Anmelden
            </button>
          </div>
          <p className="text-primary-300 text-sm mt-4">
            Keine Sorge, wir respektieren Ihre Privatsphäre und senden nur relevante Inhalte.
          </p>
        </div>
      </section>
    </div>
  )
}