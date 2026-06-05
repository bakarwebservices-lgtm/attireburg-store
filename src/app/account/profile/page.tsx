'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import PasswordInput from '@/components/PasswordInput'
import DashboardLayout from '@/components/DashboardLayout'

export default function UserProfile() {
  const { lang } = useLanguage()
  const { user, login } = useAuth()
  const router = useRouter()
  const t = translations[lang]

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passErr, setPassErr] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setEmail(user.email || '')
    setPhone((user as any).phone || '')
  }, [user, router])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const session = getSession()
    if (!session?.token) return
    setSaving(true)
    setProfileErr('')
    setProfileMsg('')
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ type: 'profile', firstName, lastName, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      // Update auth context with new user data
      login(data.user, session.token)
      setProfileMsg(t.dashboard.profileUpdated)
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPassErr('Passwörter stimmen nicht überein'); return }
    if (newPassword.length < 6) { setPassErr('Mindestens 6 Zeichen'); return }
    const session = getSession()
    if (!session?.token) return
    setSaving(true)
    setPassErr('')
    setPassMsg('')
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ type: 'password', currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setPassMsg(t.dashboard.passwordChanged)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPassMsg(''), 3000)
    } catch (err: any) {
      setPassErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent"
  const errClass = "text-red-600 text-sm mt-1"

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Profile */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.personalInfo}</h2>
          </div>
          <form onSubmit={handleProfileSave} className="p-6 space-y-5">
            {profileMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{profileMsg}</div>}
            {profileErr && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{profileErr}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Das ist Ihre Login-E-Mail. Änderung wird sofort wirksam.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 123 456789" className={inputClass} />
            </div>

            <button type="submit" disabled={saving}
              className="bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
              {saving ? 'Wird gespeichert...' : t.dashboard.updateProfile}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.changePassword}</h2>
          </div>
          <form onSubmit={handlePasswordSave} className="p-6 space-y-5">
            {passMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{passMsg}</div>}
            {passErr && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{passErr}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.currentPassword}</label>
              <PasswordInput value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.newPassword}</label>
              <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.confirmPassword}</label>
              <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} />
            </div>

            <button type="submit" disabled={saving}
              className="bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
              {saving ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  )
}
