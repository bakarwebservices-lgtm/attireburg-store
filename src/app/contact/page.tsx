'use client'
import { useState } from 'react'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

export default function Contact() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      setError(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const subjects = Object.values(t.contact.form.subjects)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-brand-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">{t.contact.title}</h1>
          <p className="text-lg text-brand-100 max-w-3xl mx-auto">{t.contact.subtitle}</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.contact.form.title}</h2>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                  {t.contact.form.success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.name} *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange}
                      placeholder={t.contact.form.namePlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.email} *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder={t.contact.form.emailPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.subject} *</label>
                  <select name="subject" required value={formData.subject} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent">
                    <option value="">{t.contact.form.subjectPlaceholder}</option>
                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.form.message} *</label>
                  <textarea name="message" required rows={6} value={formData.message} onChange={handleChange}
                    placeholder={t.contact.form.messagePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  {loading ? t.contact.form.sending : t.contact.form.send}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.contact.info.title}</h2>
                <div className="space-y-5">
                  <div className="flex items-start space-x-4">
                    <div className="w-11 h-11 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5">{t.contact.info.address}</p>
                      <p className="text-gray-600 text-sm">Attireburg GmbH<br />Musterstraße 123<br />10115 Berlin, Deutschland</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-11 h-11 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5">{t.contact.info.phone}</p>
                      <p className="text-gray-600 text-sm"><a href="tel:+4930123456789" className="hover:text-brand-800">+49 30 123 456 789</a></p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-11 h-11 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5">{t.contact.info.email}</p>
                      <p className="text-gray-600 text-sm"><a href="mailto:info@attireburg.de" className="hover:text-brand-800">info@attireburg.de</a></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">{t.contact.hours.title}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.contact.hours.weekdays}</span>
                    <span className="font-semibold text-gray-900">9:00 – 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.contact.hours.saturday}</span>
                    <span className="font-semibold text-gray-900">10:00 – 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.contact.hours.sunday}</span>
                    <span className="font-semibold text-gray-900">{t.contact.hours.closed}</span>
                  </div>
                </div>
                <p className="mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500">{t.contact.hours.note}</p>
              </div>

              <div className="bg-brand-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-brand-800 mb-2">{t.contact.faq.title}</h3>
                <p className="text-brand-700 text-sm mb-4">{t.contact.faq.subtitle}</p>
                <a href="/faq" className="inline-block bg-brand-800 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                  {t.contact.faq.button}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
