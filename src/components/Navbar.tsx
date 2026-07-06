'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/ClientLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { translations } from '@/lib/translations'
import LanguageSwitcher from './LanguageSwitcher'
import ClientOnly from './ClientOnly'

export default function Navbar() {
  const { lang } = useLanguage()
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo.png')
  const [announcements, setAnnouncements] = useState<string[]>([])
  const t = translations[lang]

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.logoUrl) setLogoUrl(d.logoUrl)
        const announcementText = lang === 'de' ? d?.announcementDe : d?.announcementEn
        if (announcementText) {
          const list = announcementText.split('\n').map((s: string) => s.trim()).filter(Boolean)
          setAnnouncements(list)
        }
      })
      .catch(() => {})
  }, [lang])

  const marqueeItems = [...announcements, ...announcements]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Announcement bar */}
      <div className="bg-brand-800 text-white text-xs py-2 overflow-hidden">
        <div className="animate-marquee flex">
          {marqueeItems.map((text, i) => (
            <span key={i} className="px-10 whitespace-nowrap">
              {text}
              <span className="mx-8 opacity-40">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14">

          {/* Left — nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700 flex-1">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <Link href="/products" className="hover:text-black transition-colors">{t.nav.products}</Link>
            <Link href="/customize" className="hover:text-black transition-colors">Print on Demand</Link>
            <Link href="/about" className="hover:text-black transition-colors">{t.nav.about}</Link>
          </nav>

          {/* Mobile hamburger - left side */}
          <button className="md:hidden text-gray-700 mr-3" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          {/* Center — logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <img src={logoUrl} alt="Attireburg" className="h-9 w-auto" />
          </Link>

          {/* Right — icons */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Link href="/search" className="text-gray-700 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {user && (
              <Link href="/account/wishlist" className="hidden sm:block text-gray-700 hover:text-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            )}

            <Link href="/cart" className="relative text-gray-700 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <ClientOnly>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-800 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </ClientOnly>
            </Link>

            <div className="relative transform translate-y-[1.5px] flex items-center">
              {user ? (
                <>
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="text-gray-700 hover:text-black transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg text-sm z-50">
                      <Link href="/account" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Konto</Link>
                      <Link href="/account/orders" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Bestellungen</Link>
                      {user.isAdmin && <Link href="/admin" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Admin</Link>}
                      <button onClick={() => { logout(); setShowUserMenu(false) }} className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 border-t border-gray-100">Abmelden</button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">{t.nav.login}</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 text-sm font-medium text-gray-700">
          <Link href="/" className="flex items-center gap-2 py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>
            Startseite
          </Link>
          <Link href="/products" className="block py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>{t.nav.products}</Link>
          <Link href="/customize" className="block py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>Print on Demand</Link>
          <Link href="/about" className="block py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>{t.nav.about}</Link>
          <Link href="/contact" className="block py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>{t.nav.contact}</Link>
          {user && <Link href="/account/wishlist" className="block py-2.5 border-b border-gray-50" onClick={() => setMobileOpen(false)}>{t.nav.wishlist}</Link>}
          <div className="pt-2">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  )
}
