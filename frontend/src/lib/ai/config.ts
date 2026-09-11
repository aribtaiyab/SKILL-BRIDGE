/**
 * Server-only AI Layer Configuration — Groq API
 *
 * Primary Provider: Groq API (https://api.groq.com/openai/v1)
 * Preferred Model: openai/gpt-oss-120b (or configurable via GROQ_MODEL)
 */

export const AI_CONFIG = {
  get apiKey(): string {
    return (process.env.GROQ_API_KEY || '').trim()
  },
  get model(): string {
    return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  },
  get baseUrl(): string {
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
    return (process.env.GROQ_API_KEY || '').trim().length > 0
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
  provider: 'groq'
  model: string
} {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()

  return {
    configured: isConfigured,
    provider: 'groq',
    model: AI_CONFIG.model,
  }
}

