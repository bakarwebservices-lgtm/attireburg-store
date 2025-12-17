'use client'
import Link from 'next/link'
import { useState } from 'react'
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
  const t = translations[lang]

  return (
    <nav className="bg-primary-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-primary-200 transition-colors">
            Attireburg
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-primary-200 transition-colors">
              {t.nav.home}
            </Link>
            <Link href="/products" className="hover:text-primary-200 transition-colors">
              {t.nav.products}
            </Link>
            <Link href="/about" className="hover:text-primary-200 transition-colors">
              {t.nav.about}
            </Link>
            <Link href="/contact" className="hover:text-primary-200 transition-colors">
              {t.nav.contact}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Search Icon */}
            <Link href="/search" className="hover:text-primary-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Wishlist */}
            {user && (
              <Link href="/wishlist" className="hover:text-primary-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="hover:text-primary-200 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <ClientOnly>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </ClientOnly>
            </Link>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="hover:text-primary-200 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden md:block">{user.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t.nav.account}
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Bestellungen
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Abmelden
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hover:text-primary-200 transition-colors">
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}