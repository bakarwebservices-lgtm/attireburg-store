'use client'
import { useState, createContext, useContext } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
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
  const [lang, setLang] = useState<Language>('de')

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </LanguageContext.Provider>
  )
}