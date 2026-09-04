/**
 * Centralized Client-Safe Environment Configuration
 */

export interface EnvironmentHealthSummary {
  supabase: {
    configured: boolean
    hasUrl: boolean
    hasAnonKey: boolean
  }
  app: {
    nodeEnv: string
    appUrl: string
    apiUrl: string
  }
}

export const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
}

/**
 * Returns safe frontend environment health status without leaking any secret tokens.
 */
export function getEnvironmentHealth(): EnvironmentHealthSummary {
  const hasUrl = Boolean(ENV.NEXT_PUBLIC_SUPABASE_URL && !ENV.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))
  const hasAnonKey = Boolean(ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY && !ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder'))

  return {
    supabase: {
      configured: hasUrl && hasAnonKey,
      hasUrl,
      hasAnonKey,
    },
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: ENV.NEXT_PUBLIC_APP_URL,
      apiUrl: ENV.NEXT_PUBLIC_API_URL,
    },
  }
}
