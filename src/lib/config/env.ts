/**
 * Centralized Environment Configuration & Runtime Diagnostic
 *
 * Safe for server operations. Ensures variable consistency across Phase 1-9.
 */

export interface EnvironmentHealthSummary {
  supabase: {
    configured: boolean
    hasUrl: boolean
    hasAnonKey: boolean
    hasServiceRoleKey: boolean
  }
  ai: {
    configured: boolean
    provider: string
    model: string
  }
  app: {
    nodeEnv: string
    appUrl: string
  }
}

export const ENV = {
  // Public
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Server Private
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
}

/**
 * Returns safe environment health status without leaking any secret tokens.
 */
export function getEnvironmentHealth(): EnvironmentHealthSummary {
  const hasUrl = Boolean(ENV.NEXT_PUBLIC_SUPABASE_URL && !ENV.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))
  const hasAnonKey = Boolean(ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY && !ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder'))
  const hasServiceRoleKey = Boolean(ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder'))

  const hasGroqKey = Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.trim().length > 0)

  return {
    supabase: {
      configured: hasUrl && hasAnonKey,
      hasUrl,
      hasAnonKey,
      hasServiceRoleKey,
    },
    ai: {
      configured: hasGroqKey,
      provider: hasGroqKey ? 'Groq' : 'Deterministic Fallback',
      model: ENV.GROQ_MODEL,
    },
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: ENV.NEXT_PUBLIC_APP_URL,
    },
  }
}
