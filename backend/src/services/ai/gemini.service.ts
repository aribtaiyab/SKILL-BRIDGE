import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from '../../ai/config.js'

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export type GeminiErrorCategory =
  | 'daily_quota_exhausted'
  | 'rate_limited'
  | 'model_unavailable'
  | 'auth_error'
  | 'server_error'
  | 'timeout'
  | 'unknown'

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory
  message: string
  retryDelaySeconds?: number
  canRetry: boolean
  suggestedModel?: string
}

export interface GeminiHealthStatus {
  configured: boolean
  provider: 'gemini'
  model: string
  reachable: boolean
  category: 'connected' | GeminiErrorCategory | 'unconfigured'
  message: string
  maskedKey: string
  fallbackActive: boolean
}

export class GeminiService {
  private static client: GoogleGenAI | null = null
  private static clientApiKey: string | null = null

  /**
   * Safely masks an API key (e.g., 'AQ.A...cnfA'). Never exposes full key.
   */
  static maskKey(key?: string): string {
    const k = (key || AI_CONFIG.apiKey || '').trim()
    if (!k) return '[UNCONFIGURED]'
    if (k.length <= 8) return '****'
    return `${k.slice(0, 4)}...${k.slice(-4)}`
  }

  private static getClient(): GoogleGenAI | null {
    const apiKey = AI_CONFIG.apiKey
    if (!apiKey) return null
    if (!this.client || this.clientApiKey !== apiKey) {
      this.client = new GoogleGenAI({ apiKey })
      this.clientApiKey = apiKey
    }
    return this.client
  }

  /**
   * Classifies Gemini API errors safely without leaking sensitive information.
   */
  static classifyError(err: any, currentModel: string): ClassifiedGeminiError {
    const rawMsg: string = err?.message || err?.toString() || ''
    const status: number = Number(err?.status || err?.statusCode || (rawMsg.includes('429') ? 429 : rawMsg.includes('404') ? 404 : 0))

    // 1. Quota / Rate Limit (429 / RESOURCE_EXHAUSTED)
    if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
      const isDailyLimit =
        rawMsg.includes('PerDay') ||
        rawMsg.includes('per day') ||
        rawMsg.includes('limit: 20') ||
        rawMsg.includes('FreeTier') ||
        rawMsg.includes('quotaId')

      // Extract retry delay if provided by Google (e.g. "retry in 18s" or "57.9s")
      const retryMatch = rawMsg.match(/retry in ([\d.]+)s/i) || rawMsg.match(/retryDelay["']?\s*:\s*["']?(\d+)s?/i)
      const retryDelaySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : undefined

      if (isDailyLimit) {
        return {
          category: 'daily_quota_exhausted',
          message: 'Gemini free-tier daily request quota exhausted for this project. Deterministic fallback active.',
          retryDelaySeconds,
          canRetry: false, // NEVER retry daily quota exhaustion
        }
      }

      return {
        category: 'rate_limited',
        message: 'Gemini temporary rate limit exceeded. Bounded backoff / fallback active.',
        retryDelaySeconds,
        canRetry: retryDelaySeconds !== undefined && retryDelaySeconds <= 2,
      }
    }

    // 2. Model Unavailable / Retired (404 / NOT_FOUND)
    if (status === 404 || rawMsg.includes('NOT_FOUND') || rawMsg.includes('no longer available') || rawMsg.includes('is not found')) {
      return {
        category: 'model_unavailable',
        message: `Gemini model "${currentModel}" is unavailable or deprecated for this key.`,
        canRetry: currentModel !== 'gemini-3.5-flash',
        suggestedModel: 'gemini-3.5-flash',
      }
    }

    // 3. Authentication / Permission (401 / 403 / PERMISSION_DENIED)
    if (status === 401 || status === 403 || rawMsg.includes('API key not valid') || rawMsg.includes('PERMISSION_DENIED')) {
      return {
        category: 'auth_error',
        message: 'Invalid or restricted GEMINI_API_KEY. Check Google AI Studio credentials.',
        canRetry: false,
      }
    }

    // 4. Timeout
    if (rawMsg.includes('timeout') || err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
      return {
        category: 'timeout',
        message: 'Gemini request timed out. Deterministic fallback active.',
        canRetry: false,
      }
    }

    // 5. Server Error (5xx)
    if (status >= 500 && status < 600) {
      return {
        category: 'server_error',
        message: 'Google Gemini servers returned a temporary 5xx error.',
        canRetry: true,
      }
    }

    return {
      category: 'unknown',
      message: 'Gemini request failed. Safe fallback activated.',
      canRetry: false,
    }
  }

  /**
   * Generates structured JSON output adhering to a specified schema or format.
   * Includes smart 429 handling, bounded retry, model failover, and zero-crash guarantee.
   */
  static async generateStructured<T = any>(options: {
    systemInstruction: string
    userPrompt: string
    history?: GeminiMessage[]
    enableSearchGrounding?: boolean
    temperature?: number
    maxTokens?: number
    overrideModel?: string
  }): Promise<T | null> {
    const apiKey = AI_CONFIG.apiKey
    if (!apiKey) {
      console.warn('[GeminiService] GEMINI_API_KEY is not configured; using deterministic fallback')
      return null
    }

    const ai = this.getClient()
    if (!ai) return null

    let targetModel = options.overrideModel || AI_CONFIG.model

    const contents: any[] = []
    if (options.history && options.history.length > 0) {
      for (const h of options.history) {
        contents.push({
          role: h.role,
          parts: h.parts.map(p => ({ text: p.text })),
        })
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: options.userPrompt }],
    })

    const config: any = {
      systemInstruction: options.systemInstruction,
      temperature: options.temperature ?? AI_CONFIG.temperature,
      maxOutputTokens: options.maxTokens ?? AI_CONFIG.maxTokens,
      responseMimeType: 'application/json',
    }

    if (options.enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }]
    }

    // Single attempt loop (max 1 retry if retryable)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[GeminiService] Request attempt ${attempt} using model "${targetModel}" (key: ${this.maskKey()})`)
        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config,
        })

        const candidateText = response.text?.trim()
        if (!candidateText) {
          console.warn('[GeminiService] Empty response parts from Gemini, activating fallback')
          return null
        }

        const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
        return JSON.parse(cleanJson) as T
      } catch (err: any) {
        const classified = this.classifyError(err, targetModel)
        console.warn(`[GeminiService] Attempt ${attempt} failed [${classified.category}]: ${classified.message}`)

        // If daily quota exhausted, NEVER retry — immediately fall back
        if (classified.category === 'daily_quota_exhausted') {
          console.warn('[GeminiService] Daily quota exhausted. Immediate deterministic fallback engaged.')
          return null
        }

        // If model is unavailable (e.g. 2.5-flash retired for new keys), switch to 3.6-flash and retry once
        if (classified.suggestedModel && targetModel !== classified.suggestedModel && attempt === 1) {
          console.log(`[GeminiService] Switching model from "${targetModel}" to "${classified.suggestedModel}" for retry`)
          targetModel = classified.suggestedModel
          continue
        }

        // If transient rate limit with short delay (<= 2s) and attempt 1, back off once
        if (classified.canRetry && attempt === 1) {
          const delayMs = Math.min((classified.retryDelaySeconds || 1) * 1000, 2000)
          console.log(`[GeminiService] Backing off for ${delayMs}ms before retry...`)
          await new Promise(res => setTimeout(res, delayMs))
          continue
        }

        // Otherwise abort retries and engage deterministic fallback
        break
      }
    }

    console.warn('[GeminiService] Gemini unavailable; deterministic SkillBridge engine active.')
    return null
  }

  /**
   * Generates standard text response with smart error handling.
   */
  static async generateText(options: {
    systemInstruction: string
    userPrompt: string
    temperature?: number
    overrideModel?: string
  }): Promise<string | null> {
    const apiKey = AI_CONFIG.apiKey
    if (!apiKey) return null

    const ai = this.getClient()
    if (!ai) return null

    let targetModel = options.overrideModel || AI_CONFIG.model

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: options.userPrompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: 1024,
          },
        })

        return response.text?.trim() || null
      } catch (err: any) {
        const classified = this.classifyError(err, targetModel)
        console.warn(`[GeminiService] generateText failed [${classified.category}]: ${classified.message}`)

        if (classified.suggestedModel && targetModel !== classified.suggestedModel && attempt === 1) {
          targetModel = classified.suggestedModel
          continue
        }

        if (classified.canRetry && attempt === 1) {
          await new Promise(res => setTimeout(res, 1000))
          continue
        }

        break
      }
    }

    return null
  }

  /**
   * Safe public health and connection diagnostic probe.
   * NEVER exposes raw keys or secrets. Returns classified status.
   */
  static async testConnection(): Promise<GeminiHealthStatus> {
    const isConfigured = AI_CONFIG.isLiveProviderConfigured()
    const model = AI_CONFIG.model
    const maskedKey = this.maskKey()

    if (!isConfigured) {
      return {
        configured: false,
        provider: 'gemini',
        model,
        reachable: false,
        category: 'unconfigured',
        message: 'GEMINI_API_KEY is not configured in backend/.env; running in deterministic engine mode',
        maskedKey,
        fallbackActive: true,
      }
    }

    try {
      const url = `${AI_CONFIG.baseUrl}/models/${model}:generateContent?key=${AI_CONFIG.apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] }),
        signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
      })

      if (response.ok) {
        const data = (await response.json()) as any
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          return {
            configured: true,
            provider: 'gemini',
            model,
            reachable: true,
            category: 'connected',
            message: `Google Gemini API connected and verified with model "${model}"`,
            maskedKey,
            fallbackActive: false,
          }
        }
      }

      // Non-OK status: parse error safely and classify
      let rawDetail = ''
      try {
        const errBody = (await response.json()) as any
        rawDetail = errBody?.error?.message || errBody?.message || ''
      } catch {
        // ignore JSON parse error
      }

      const classified = this.classifyError(
        { status: response.status, message: rawDetail },
        model
      )

      return {
        configured: true,
        provider: 'gemini',
        model,
        reachable: false,
        category: classified.category,
        message: classified.message,
        maskedKey,
        fallbackActive: true,
      }
    } catch (err: any) {
      const classified = this.classifyError(err, model)
      return {
        configured: true,
        provider: 'gemini',
        model,
        reachable: false,
        category: classified.category,
        message: classified.message,
        maskedKey,
        fallbackActive: true,
      }
    }
  }
}
