'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'

export default function ForgotPassword() {
  const { lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate — in production you'd send a password reset email
    await new Promise(r => setTimeout(r, 800))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <img src="/logo.png" alt="Attireburg" className="h-10 w-auto" />
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {lang === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {lang === 'de'
            ? 'Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Reset-Link.'
            : 'Enter your email address and we\'ll send you a reset link.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lang === 'de' ? 'E-Mail gesendet!' : 'Email sent!'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {lang === 'de'
                  ? `Wenn ein Konto mit ${email} existiert, erhalten Sie in Kürze eine E-Mail mit einem Reset-Link.`
                  : `If an account with ${email} exists, you'll receive a reset email shortly.`}
              </p>
              <Link href="/login" className="text-brand-800 hover:text-brand-700 font-medium text-sm">
                {lang === 'de' ? '← Zurück zur Anmeldung' : '← Back to login'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'de' ? 'E-Mail-Adresse' : 'Email address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={lang === 'de' ? 'ihre@email.de' : 'your@email.com'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading
                  ? (lang === 'de' ? 'Wird gesendet...' : 'Sending...')
                  : (lang === 'de' ? 'Reset-Link senden' : 'Send reset link')}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-brand-800 hover:text-brand-700 font-medium">
                  {lang === 'de' ? '← Zurück zur Anmeldung' : '← Back to login'}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
