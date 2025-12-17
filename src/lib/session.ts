'use client'
import { AuthUser } from './auth'

const SESSION_KEY = 'attireburg_session'

export function saveSession(user: AuthUser, token: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }))
  } catch (error) {
    console.error('Error saving session:', error)
  }
}

export function getSession(): { user: AuthUser; token: string } | null {
  try {
    const session = localStorage.getItem(SESSION_KEY)
    return session ? JSON.parse(session) : null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function isAdmin(): boolean {
  const session = getSession()
  return session?.user?.isAdmin || false
}