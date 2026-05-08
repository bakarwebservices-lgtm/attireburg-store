'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'

type Step = 'type' | 'details' | 'success'
type ClientType = 'individual' | 'business'

export default function CustomizePage() {
  const { lang } = useLanguage()
  const t = translations[lang].customize
  const [step, setStep] = useState<Step>('type')
  const [clientType, setClientType] = useState<ClientType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '', file: null as File | null })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(p => ({ ...p, file }))
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    setSubmitting(false)
    setStep('success')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t.title}</h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto">{t.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {step === 'type' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{t.whoAreYou}</h2>
            <p className="text-gray-600 text-center mb-10">{t.chooseOption}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => { setClientType('individual'); setStep('details') }}
                className="group bg-white border-2 border-gray-200 hover:border-gray-900 rounded-xl p-8 text-left transition-all hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-gray-900 rounded-full flex items-center justify-center mb-5 transition-colors">
                  <svg className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.individual}</h3>
                <p className="text-gray-500 text-sm">{t.individualDesc}</p>
              </button>

              <button
                onClick={() => { setClientType('business'); setStep('details') }}
                className="group bg-white border-2 border-gray-200 hover:border-gray-900 rounded-xl p-8 text-left transition-all hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-gray-900 rounded-full flex items-center justify-center mb-5 transition-colors">
                  <svg className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.business}</h3>
                <p className="text-gray-500 text-sm">{t.businessDesc}</p>
              </button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div>
            <button
              onClick={() => setStep('type')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-8 text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t.back}
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.yourRequest}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.name} *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white"
                    placeholder={t.namePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.email} *</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white"
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white"
                    placeholder={t.phonePlaceholder}
                  />
                </div>
                {clientType === 'business' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.company} *</label>
                    <input
                      type="text" required value={form.company}
                      onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white"
                      placeholder={t.companyPlaceholder}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.message}</label>
                <textarea
                  rows={4} value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white resize-none"
                  placeholder={t.messagePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.designFile}</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-gray-900 p-6 text-center cursor-pointer transition-colors bg-white"
                >
                  <input
                    ref={fileInputRef} type="file"
                    accept="image/*,.pdf,.ai,.eps,.svg"
                    onChange={handleFileChange} className="hidden"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
                      <p className="text-sm text-gray-600 font-medium">{form.file?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        {lang === 'de' ? 'Klicken zum Hochladen' : 'Click to upload'}
                      </p>
                      <p className="text-xs text-gray-400">{t.fileTypes}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-4 transition-colors text-sm"
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.successTitle}</h2>
            <p className="text-gray-600 text-lg mb-2">{t.successMessage}, {form.name}.</p>
            <p className="text-gray-500 mb-10">
              {t.successSub} <span className="text-gray-900 font-medium">{form.email}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 transition-colors text-sm">
                {t.backToHome}
              </Link>
              <Link href="/products" className="border border-gray-900 text-gray-900 hover:bg-gray-50 font-semibold px-8 py-3 transition-colors text-sm">
                {t.viewProducts}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
