'use client'
import { useLanguage } from '@/components/ClientLayout'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center gap-2 bg-primary-700 rounded-lg p-1">
      <button
        onClick={() => setLang('de')}
        className={`px-3 py-1 rounded transition-colors ${
          lang === 'de' ? 'bg-primary-600 text-white' : 'text-primary-200 hover:text-white'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded transition-colors ${
          lang === 'en' ? 'bg-primary-600 text-white' : 'text-primary-200 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}