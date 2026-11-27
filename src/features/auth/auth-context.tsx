import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  authRepository,
  type AuthActionResult,
  type AuthCredentials,
  type RegistrationCredentials
} from '@/features/auth/data/auth.repository'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>
  signUp: (credentials: RegistrationCredentials) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    const unsubscribe = authRepository.subscribe((event, nextSession) => {
      if (!isActive) return
      if (event === 'SIGNED_OUT') queryClient.clear()
      setSession(nextSession)
      setIsLoading(false)
    })

    void authRepository
      .getSession()
      .then((currentSession) => {
        if (isActive) setSession(currentSession)
      })
      .catch(() => {
        if (isActive) setSession(null)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [queryClient])

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    const result = await authRepository.signIn(credentials)
    setSession(result.session)
    return result
  }, [])

  const signUp = useCallback(async (credentials: RegistrationCredentials) => {
    const result = await authRepository.signUp(credentials)
    setSession(result.session)
    return result
  }, [])

  const signOut = useCallback(async () => {
    await authRepository.signOut()
    queryClient.clear()
    setSession(null)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoading, signIn, signUp, signOut }),
    [isLoading, session, signIn, signOut, signUp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return context
}
