import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ENV, isSupabaseConfigured } from './env.js'

let supabaseAdmin: SupabaseClient | null = null
let supabasePublic: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!supabaseAdmin) {
    const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY
    supabaseAdmin = createClient(ENV.SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdmin
}

export function getSupabasePublic(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!supabasePublic) {
    supabasePublic = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabasePublic
}

/**
 * Creates a scoped Supabase client with the caller's JWT access token
 */
export function createScopedSupabaseClient(accessToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
