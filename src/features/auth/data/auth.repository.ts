import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { env } from '@/core/config/env'
import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegistrationCredentials extends AuthCredentials {
  fullName?: string | undefined
}

export interface AuthActionResult {
  session: Session | null
  requiresEmailConfirmation: boolean
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new AppError(
      'NETWORK_ERROR',
      'Supabase bağlantısı yapılandırılmadan hesap işlemleri kullanılamaz.'
    )
  }
  return client
}

function mapAuthError(message: string): AppError {
  return new AppError('AUTHENTICATION_ERROR', message)
}

export const authRepository = {
  async getSession(): Promise<Session | null> {
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await client.auth.getSession()
    if (error) throw mapAuthError(error.message)
    return data.session
  },

  subscribe(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const client = getSupabaseClient()
    if (!client) return () => undefined

    const { data } = client.auth.onAuthStateChange(callback)
    return () => data.subscription.unsubscribe()
  },

  async signIn(credentials: AuthCredentials): Promise<AuthActionResult> {
    const client = requireClient()
    const { data, error } = await client.auth.signInWithPassword(credentials)
    if (error) throw mapAuthError(error.message)
    return { session: data.session, requiresEmailConfirmation: false }
  },

  async signUp(credentials: RegistrationCredentials): Promise<AuthActionResult> {
    const client = requireClient()
    const { data, error } = await client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: { full_name: credentials.fullName?.trim() || null },
        emailRedirectTo: new URL('/auth/callback', env.appUrl).toString()
      }
    })
    if (error) throw mapAuthError(error.message)
    return {
      session: data.session,
      requiresEmailConfirmation: data.session === null
    }
  },

  async signOut(): Promise<void> {
    const client = requireClient()
    const { error } = await client.auth.signOut({ scope: 'local' })
    if (error) throw mapAuthError(error.message)
  }
}
