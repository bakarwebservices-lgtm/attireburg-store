'use client'
import { useLanguage } from '@/components/ClientLayout'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center border border-gray-300 rounded overflow-hidden text-xs font-medium">
      <button
        onClick={() => setLang('de')}
        className={`px-2.5 py-1.5 transition-colors ${
          lang === 'de' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        DE
      </button>
      <div className="w-px h-4 bg-gray-300" />
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1.5 transition-colors ${
          lang === 'en' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        EN
      </button>
    </div>
  )
}
