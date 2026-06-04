'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/ClientLayout'

const COOKIE_KEY = 'attireburg_cookie_consent'

export default function CookieConsent() {
  const { lang } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false })

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: true, marketing: true }))
    setVisible(false)
  }

  const deny = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: false, marketing: false }))
    setVisible(false)
  }

  const savePrefs = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs))
    setVisible(false)
  }

  if (!visible) return null

  const t = {
    de: {
      title: 'Datenschutz & Cookies',
      desc: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und unsere Dienste zu optimieren. Sie können Ihre Einstellungen jederzeit anpassen.',
      accept: 'Alle akzeptieren',
      deny: 'Ablehnen',
      prefs: 'Einstellungen',
      save: 'Einstellungen speichern',
      analytics: 'Analyse-Cookies',
      analyticsDesc: 'Helfen uns zu verstehen, wie Besucher die Website nutzen.',
      marketing: 'Marketing-Cookies',
      marketingDesc: 'Ermöglichen personalisierte Werbung.',
      privacy: 'Datenschutzerklärung',
    },
    en: {
      title: 'Privacy & Cookies',
      desc: 'We use cookies to improve your experience and optimize our services. You can adjust your preferences at any time.',
      accept: 'Accept all',
      deny: 'Deny',
      prefs: 'Preferences',
      save: 'Save preferences',
      analytics: 'Analytics cookies',
      analyticsDesc: 'Help us understand how visitors use the website.',
      marketing: 'Marketing cookies',
      marketingDesc: 'Enable personalized advertising.',
      privacy: 'Privacy Policy',
    },
  }[lang]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 shadow-xl rounded-lg p-5">
        {!showPrefs ? (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t.title}</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {t.desc}{' '}
                <a href="/privacy" className="text-brand-800 underline underline-offset-2 hover:text-brand-700">{t.privacy}</a>
              </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={accept}
                className="bg-brand-800 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
              >
                {t.accept}
              </button>
              <button
                onClick={deny}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-5 py-2 rounded transition-colors"
              >
                {t.deny}
              </button>
              <button
                onClick={() => setShowPrefs(true)}
                className="border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2 rounded transition-colors"
              >
                {t.prefs}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t.prefs}</h3>
            <div className="space-y-3 mb-4">
              {/* Necessary — always on */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Notwendige Cookies</p>
                  <p className="text-xs text-gray-500">Für den Betrieb der Website erforderlich.</p>
                </div>
                <span className="text-xs text-gray-400 mt-1 shrink-0">Immer aktiv</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.analytics}</p>
                  <p className="text-xs text-gray-500">{t.analyticsDesc}</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors mt-0.5 ${prefs.analytics ? 'bg-brand-800' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs.analytics ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.marketing}</p>
                  <p className="text-xs text-gray-500">{t.marketingDesc}</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors mt-0.5 ${prefs.marketing ? 'bg-brand-800' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs.marketing ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={savePrefs} className="bg-brand-800 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded transition-colors">
                {t.save}
              </button>
              <button onClick={() => setShowPrefs(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
                ← {lang === 'de' ? 'Zurück' : 'Back'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
