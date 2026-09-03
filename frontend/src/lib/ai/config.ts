/**
 * Server-only AI Layer Configuration — Groq API
 *
 * Primary Provider: Groq API (https://api.groq.com/openai/v1)
 * Default Model: openai/gpt-oss-120b
 */

export const AI_CONFIG = {
  get apiKey(): string {
    return (process.env.GROQ_API_KEY || '').trim()
  },
  get model(): string {
    return process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  },
  get baseUrl(): string {
    return process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
  },
  get maxTokens(): number {
    return Number(process.env.AI_MAX_TOKENS) || 1500
  },
  get temperature(): number {
    return Number(process.env.AI_TEMPERATURE) || 0.4
  },
  get timeoutMs(): number {
    return Number(process.env.AI_TIMEOUT_MS) || 12000
  },
  isLiveProviderConfigured(): boolean {
    return (process.env.GROQ_API_KEY || '').trim().length > 0
  },
}

/**
 * Safe internal diagnostic health check (does not expose secrets)
 */
export function getAIConfigurationStatus(): {
  configured: boolean
  providerType: 'groq' | 'fallback_deterministic'
  model: string
  baseUrl: string
} {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()

  return {
    configured: isConfigured,
    providerType: isConfigured ? 'groq' : 'fallback_deterministic',
    model: AI_CONFIG.model,
    baseUrl: AI_CONFIG.baseUrl,
  }
}
