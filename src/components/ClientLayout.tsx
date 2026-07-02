'use client'
import { useState, createContext, useContext, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AlertProvider } from '@/contexts/AlertContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export type Language = 'de' | 'en'

const LanguageContext = createContext<{
  lang: Language
  setLang: (lang: Language) => void
}>({
  lang: 'de',
  setLang: () => {},
})

export const useLanguage = () => useContext(LanguageContext)

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [lang, setLangState] = useState<Language>('de')

  // Load persisted language on mount
  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language | null
    if (saved === 'de' || saved === 'en') {
      setLangState(saved)
    }
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AlertProvider>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </AlertProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageContext.Provider>
  )
}