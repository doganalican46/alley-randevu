import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/core/config/env'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!env.isSupabaseConfigured || !env.supabaseUrl || !env.supabasePublishableKey) {
    return null
  }

  client ??= createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return client
}
