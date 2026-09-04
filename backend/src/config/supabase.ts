import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ENV, isSupabaseConfigured } from './env.js'

let supabaseAdmin: SupabaseClient | null = null
let supabasePublic: SupabaseClient | null = null

function createSupabaseClient(key: string, accessToken?: string): SupabaseClient {
  return createClient(ENV.SUPABASE_URL, key, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!supabaseAdmin) {
    const key = ENV.SUPABASE_SERVICE_ROLE_KEY
    if (!key) return null
    supabaseAdmin = createSupabaseClient(key)
  }
  return supabaseAdmin
}

export function getSupabasePublic(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!supabasePublic) {
    supabasePublic = createSupabaseClient(ENV.SUPABASE_ANON_KEY)
  }
  return supabasePublic
}

/**
 * Creates a scoped Supabase client with the caller's JWT access token
 */
export function createScopedSupabaseClient(accessToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  return createSupabaseClient(ENV.SUPABASE_ANON_KEY, accessToken)
}
