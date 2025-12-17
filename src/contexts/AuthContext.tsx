'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser } from '@/lib/auth'
import { getSession, saveSession, clearSession } from '@/lib/session'

interface AuthContextType {
  user: AuthUser | null
  login: (user: AuthUser, token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const session = getSession()
    if (session) {
      setUser(session.user)
    }
    setIsLoading(false)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div>{children}</div>
  }

  const login = (user: AuthUser, token: string) => {
    setUser(user)
    saveSession(user, token)
  }

  const logout = () => {
    setUser(null)
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)