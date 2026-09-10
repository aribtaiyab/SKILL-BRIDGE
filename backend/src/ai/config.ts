/**
 * Server-only AI Layer Configuration — Google Gemini API
 *
 * Primary Provider: Google Gemini API (https://generativelanguage.googleapis.com)
 * Preferred Model: gemini-2.5-flash
 */

export const AI_CONFIG = {
  get apiKey(): string {
    return (process.env.GEMINI_API_KEY || '').trim()
  },
  get model(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.7-flash'
  },
  get baseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1beta'
  },
  get maxTokens(): number {
    return Number(process.env.AI_MAX_TOKENS) || 2048
  },
  get temperature(): number {
    return Number(process.env.AI_TEMPERATURE) || 0.2
  },
  get timeoutMs(): number {
    return Number(process.env.AI_TIMEOUT_MS) || 40000
  },
  isLiveProviderConfigured(): boolean {
    return (process.env.GEMINI_API_KEY || '').trim().length > 0
  },
}

/**
 * Safe internal diagnostic health check (does not expose secrets)
 */
export function getAIConfigurationStatus(): {
  configured: boolean
  provider: 'gemini'
  model: string
} {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()

  return {
    configured: isConfigured,
    provider: 'gemini',
    model: AI_CONFIG.model,
  }
}
