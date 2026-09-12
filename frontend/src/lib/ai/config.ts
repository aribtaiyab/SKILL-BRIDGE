/**
 * Server-only AI Layer Configuration — Grok / Groq API
 *
 * Supports Grok (xAI API) and Groq API via standard OpenAI-compatible endpoints.
 * Never exposed client-side.
 */

export const AI_CONFIG = {
  get apiKey(): string {
    return (process.env.GROK_API_KEY || process.env.GROQ_API_KEY || '').trim()
  },
  get provider(): 'grok' | 'groq' | 'unconfigured' {
    if ((process.env.GROK_API_KEY || '').trim().length > 0) return 'grok'
    if ((process.env.GROQ_API_KEY || '').trim().length > 0) return 'groq'
    return 'unconfigured'
  },
  get model(): string {
    if ((process.env.GROK_API_KEY || '').trim().length > 0) {
      return process.env.GROK_MODEL || 'grok-beta'
    }
    return process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  },
  get baseUrl(): string {
    if ((process.env.GROK_API_KEY || '').trim().length > 0) {
      return (process.env.GROK_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '')
    }
    return (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
  },
  get maxTokens(): number {
    return Number(process.env.AI_MAX_TOKENS) || 2048
  },
  get temperature(): number {
    return Number(process.env.AI_TEMPERATURE) || 0.2
  },
  get timeoutMs(): number {
    return Number(process.env.AI_TIMEOUT_MS) || 45000
  },
  isLiveProviderConfigured(): boolean {
    return (process.env.GROK_API_KEY || process.env.GROQ_API_KEY || '').trim().length > 0
  },
}

export function getAIConfig() {
  return AI_CONFIG
}

/**
 * Safe internal diagnostic health check (does not expose secrets)
 */
export function getAIConfigurationStatus(): {
  configured: boolean
  provider: 'grok' | 'groq' | 'unconfigured'
  model: string
} {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()

  return {
    configured: isConfigured,
    provider: AI_CONFIG.provider,
    model: AI_CONFIG.model,
  }
}
