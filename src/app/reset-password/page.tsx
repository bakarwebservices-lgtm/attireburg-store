'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/components/ClientLayout'

function ResetPasswordContent() {
  const { lang } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!email || !token) {
      setError(
        lang === 'de'
          ? 'Ungültiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen Link an.'
          : 'Invalid or expired reset link. Please request a new link.'
      )
    }
  }, [email, token, lang])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError(
        lang === 'de'
          ? 'Die Passwörter stimmen nicht überein'
          : 'Passwords do not match'
      )
      return
    }

    if (password.length < 6) {
      setError(
        lang === 'de'
          ? 'Das Passwort muss mindestens 6 Zeichen lang sein'
          : 'Password must be at least 6 characters long'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || (lang === 'de' ? 'Fehler beim Zurücksetzen des Passworts' : 'Error resetting password'))
      }
    } catch (err) {
      setError(
        lang === 'de'
          ? 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es erneut.'
          : 'A network error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-primary-800">Attireburg</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {lang === 'de' ? 'Neues Passwort erstellen' : 'Create New Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {lang === 'de'
            ? 'Geben Sie Ihr neues Passwort für das Konto ein.'
            : 'Enter your new password for the account.'}
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
                {lang === 'de' ? 'Passwort geändert!' : 'Password changed!'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {lang === 'de'
                  ? 'Ihr Passwort wurde erfolgreich aktualisiert. Sie können sich jetzt anmelden.'
                  : 'Your password has been successfully updated. You can now log in.'}
              </p>
              <Link href="/login" className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-800 hover:bg-brand-700 focus:outline-none">
                {lang === 'de' ? 'Jetzt anmelden' : 'Log in now'}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              
              {(!email || !token) ? (
                <div className="text-center">
                  <Link href="/forgot-password" className="text-brand-800 hover:text-brand-700 font-medium text-sm">
                    {lang === 'de' ? 'Neuen Link anfordern →' : 'Request new link →'}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === 'de' ? 'Neues Passwort' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {loading
                      ? (lang === 'de' ? 'Wird gespeichert...' : 'Saving...')
                      : (lang === 'de' ? 'Passwort speichern' : 'Save Password')}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
