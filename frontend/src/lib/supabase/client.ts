import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseUrl.includes('supabase.co')
  )
}

/**
 * One auth-aware browser client for all client components and API calls.
 * Keeping this singleton on the SSR client prevents session stores from diverging.
 */
type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>
type SupabaseGlobal = typeof globalThis & { __skillbridgeSupabase?: BrowserSupabaseClient }

const supabaseGlobal = globalThis as SupabaseGlobal
export const supabase = supabaseGlobal.__skillbridgeSupabase ?? createBrowserClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
supabaseGlobal.__skillbridgeSupabase = supabase

export function createAuthBrowserClient() {
  return supabase
}
