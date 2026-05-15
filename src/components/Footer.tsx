'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function Footer() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="bg-gray-900 text-gray-300 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">

        {/* Newsletter */}
        <div className="border-b border-gray-700 pb-10 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-white font-semibold text-base mb-1">{t.footer.newsletter.title}</p>
            <p className="text-gray-400 text-xs">{t.footer.newsletter.subtitle}</p>
          </div>
          {subscribed ? (
            <p className="text-green-400 text-sm font-medium">✓ {lang === 'de' ? 'Danke! Sie sind angemeldet.' : 'Thanks! You are subscribed.'}</p>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubscribed(true) }} className="flex w-full md:w-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.footer.newsletter.placeholder}
                className="flex-1 min-w-0 md:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400"
              />
              <button type="submit" className="shrink-0 bg-white text-gray-900 px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                {t.footer.newsletter.button}
              </button>
            </form>
          )}
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-white font-semibold mb-4 tracking-wide">ATTIREBURG</p>
            <p className="text-gray-400 text-xs leading-relaxed">{t.footer.description}</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">{lang === 'de' ? 'Shop' : 'Shop'}</p>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="hover:text-white transition-colors">{lang === 'de' ? 'Alle Produkte' : 'All Products'}</Link></li>
              <li><Link href="/products?category=pullover" className="hover:text-white transition-colors">{t.products.categories.pullover}</Link></li>
              <li><Link href="/products?category=jacken" className="hover:text-white transition-colors">{t.products.categories.jacken}</Link></li>
              <li><Link href="/products?onSale=true" className="hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/customize" className="hover:text-white transition-colors">Print on Demand</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">{lang === 'de' ? 'Hilfe' : 'Help'}</p>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="hover:text-white transition-colors">{t.nav.contact}</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">{t.footer.links.shipping}</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">{t.footer.links.returns}</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{t.footer.links.faq}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">{t.footer.legal}</p>
            <ul className="space-y-2.5">
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{t.footer.terms}</Link></li>
              <li><Link href="/imprint" className="hover:text-white transition-colors">{t.footer.links.imprint}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">© 2026 Attireburg. {t.footer.rights}</p>
          <div className="flex items-center gap-3">
            <svg className="h-6 w-auto opacity-60" viewBox="0 0 48 16" fill="none">
              <rect width="48" height="16" rx="2" fill="#1A1F71"/>
              <text x="6" y="12" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">VISA</text>
            </svg>
            <svg className="h-6 w-auto opacity-60" viewBox="0 0 38 24" fill="none">
              <rect width="38" height="24" rx="3" fill="#252525"/>
              <circle cx="15" cy="12" r="7" fill="#EB001B"/>
              <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
              <path d="M19 6.8a7 7 0 010 10.4A7 7 0 0119 6.8z" fill="#FF5F00"/>
            </svg>
            <svg className="h-6 w-auto opacity-60" viewBox="0 0 60 16" fill="none">
              <rect width="60" height="16" rx="2" fill="#003087"/>
              <text x="6" y="12" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">PayPal</text>
            </svg>
            <svg className="h-6 w-auto opacity-60" viewBox="0 0 60 16" fill="none">
              <rect width="60" height="16" rx="2" fill="#000"/>
              <text x="5" y="12" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">Apple Pay</text>
            </svg>
          </div>
        </div>
      </div>
    </footer>
  )
}
