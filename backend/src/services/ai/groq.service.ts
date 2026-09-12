import { AI_CONFIG } from '../../ai/config.js'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type GroqErrorCategory =
  | 'rate_limited'
  | 'daily_quota_exhausted'
  | 'model_unavailable'
  | 'auth_error'
  | 'server_error'
  | 'timeout'
  | 'unknown'

export interface ClassifiedGroqError {
  category: GroqErrorCategory
  message: string
  retryDelaySeconds?: number
  canRetry: boolean
  suggestedModel?: string
}

export interface GroqHealthStatus {
  configured: boolean
  provider: 'groq'
  model: string
  reachable: boolean
  category: 'connected' | GroqErrorCategory | 'unconfigured'
  message: string
  maskedKey: string
  fallbackActive: boolean
}

export class GroqService {
  /**
   * Safely masks an API key (e.g., 'gsk_abc1...xyz9'). Never exposes full key.
   */
  static maskKey(key?: string): string {
    const k = (key || AI_CONFIG.apiKey || '').trim()
    if (!k) return '[UNCONFIGURED]'
    if (k.length <= 8) return '****'
    return `${k.slice(0, 8)}...${k.slice(-4)}`
  }

  /**
   * Classifies Groq API errors safely without leaking sensitive information.
   */
  static classifyError(err: any, currentModel: string): ClassifiedGroqError {
    const rawMsg: string = err?.message || err?.toString() || ''
    const status: number = Number(
      err?.status || err?.statusCode || (rawMsg.includes('429') ? 429 : rawMsg.includes('404') ? 404 : 0)
    )

    // 1. Quota / Rate Limit (429)
    if (status === 429 || rawMsg.includes('rate_limit_exceeded') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      const isDailyLimit =
        rawMsg.includes('PerDay') ||
        rawMsg.includes('per day') ||
        rawMsg.includes('daily') ||
        rawMsg.includes('FreeTier')

      const retryMatch = rawMsg.match(/retry in ([\d.]+)s/i) || rawMsg.match(/try again in ([\d.]+)s/i)
      const retryDelaySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : undefined

      if (isDailyLimit) {
        return {
          category: 'daily_quota_exhausted',
          message: 'Groq daily request quota reached. Deterministic fallback engine is active.',
          retryDelaySeconds,
          canRetry: false,
        }
      }

      return {
        category: 'rate_limited',
        message: 'Groq rate limit exceeded. Bounded backoff / fallback active.',
        retryDelaySeconds,
        canRetry: retryDelaySeconds !== undefined && retryDelaySeconds <= 2,
      }
    }

    // 2. Model Unavailable / Decommissioned (400 / 404 / model_decommissioned)
    if (
      status === 404 ||
      rawMsg.includes('model_decommissioned') ||
      rawMsg.includes('decommissioned') ||
      rawMsg.includes('not found') ||
      rawMsg.includes('does not exist')
    ) {
      return {
        category: 'model_unavailable',
        message: `Groq model "${currentModel}" is unavailable or decommissioned.`,
        canRetry: currentModel !== 'openai/gpt-oss-120b',
        suggestedModel: 'openai/gpt-oss-120b',
      }
    }

    // 3. Authentication / Permission (401 / 403 / invalid_api_key)
    if (status === 401 || status === 403 || rawMsg.includes('invalid_api_key') || rawMsg.includes('Invalid API Key') || rawMsg.includes('Unauthorized')) {
      return {
        category: 'auth_error',
        message: 'Invalid or restricted GROQ_API_KEY. Check Groq Console credentials.',
        canRetry: false,
      }
    }

    // 4. Timeout
    if (rawMsg.includes('timeout') || err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
      return {
        category: 'timeout',
        message: 'Groq request timed out. Deterministic fallback active.',
        canRetry: false,
      }
    }

    // 5. Server Error (5xx)
    if (status >= 500 && status < 600) {
      return {
        category: 'server_error',
        message: 'Groq AI servers returned a temporary 5xx error.',
        canRetry: true,
      }
    }

    return {
      category: 'unknown',
      message: 'Groq request failed. Safe fallback activated.',
      canRetry: false,
    }
  }

  /**
   * Generates structured JSON output adhering to a specified schema or format.
   * Includes smart error handling, bounded retry, model failover, and zero-crash guarantee.
   */
  static async generateStructured<T = any>(options: {
    systemInstruction: string
    userPrompt: string
    history?: GroqMessage[]
    temperature?: number
    maxTokens?: number
    overrideModel?: string
  }): Promise<T | null> {
    const apiKey = AI_CONFIG.apiKey
    if (!apiKey) {
      console.warn('[GroqService] GROQ_API_KEY is not configured; using deterministic fallback')
      return null
    }

    let targetModel = options.overrideModel || AI_CONFIG.model
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: options.systemInstruction },
    ]

    if (options.history && options.history.length > 0) {
      for (const h of options.history) {
        messages.push({
          role: h.role,
          content: h.content,
        })
      }
    }

    messages.push({
      role: 'user',
      content: options.userPrompt,
    })

    const requestBody = {
      model: targetModel,
      messages,
      temperature: options.temperature ?? AI_CONFIG.temperature,
      max_tokens: options.maxTokens ?? AI_CONFIG.maxTokens,
      response_format: { type: 'json_object' },
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[GroqService] Request attempt ${attempt} using model "${targetModel}" (key: ${this.maskKey()})`)
        const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
        })

        if (!response.ok) {
          const errText = await response.text()
          throw { status: response.status, message: errText }
        }

        const data = (await response.json()) as any
        const candidateText = data?.choices?.[0]?.message?.content?.trim()
        if (!candidateText) {
          console.warn('[GroqService] Empty response content from Groq, activating fallback')
          return null
        }

        const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
        return JSON.parse(cleanJson) as T
      } catch (err: any) {
        console.error('[GroqService] Raw error details:', err?.message || err)
        const classified = this.classifyError(err, targetModel)
        console.warn(`[GroqService] Attempt ${attempt} failed [${classified.category}]: ${classified.message}`)

        if (classified.category === 'daily_quota_exhausted' || classified.category === 'auth_error') {
          return null
        }

        if (classified.suggestedModel && targetModel !== classified.suggestedModel && attempt === 1) {
          console.log(`[GroqService] Switching model from "${targetModel}" to "${classified.suggestedModel}" for retry`)
          targetModel = classified.suggestedModel
          requestBody.model = targetModel
          continue
        }

        if (classified.canRetry && attempt === 1) {
          const delayMs = Math.min((classified.retryDelaySeconds || 1) * 1000, 2000)
          console.log(`[GroqService] Backing off for ${delayMs}ms before retry...`)
          await new Promise(res => setTimeout(res, delayMs))
          continue
        }

        break
      }
    }

    console.warn('[GroqService] Groq unavailable; deterministic SkillBridge engine active.')
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

    let targetModel = options.overrideModel || AI_CONFIG.model
    const messages = [
      { role: 'system' as const, content: options.systemInstruction },
      { role: 'user' as const, content: options.userPrompt },
    ]

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
        })

        if (!response.ok) {
          const errText = await response.text()
          throw { status: response.status, message: errText }
        }

        const data = (await response.json()) as any
        return data?.choices?.[0]?.message?.content?.trim() || null
      } catch (err: any) {
        const classified = this.classifyError(err, targetModel)
        console.warn(`[GroqService] generateText failed [${classified.category}]: ${classified.message}`)

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
  static async testConnection(): Promise<GroqHealthStatus> {
    const isConfigured = AI_CONFIG.isLiveProviderConfigured()
    const model = AI_CONFIG.model
    const maskedKey = this.maskKey()

    if (!isConfigured) {
      return {
        configured: false,
        provider: 'groq',
        model,
        reachable: false,
        category: 'unconfigured',
        message: 'GROQ_API_KEY is not configured in backend/.env; running in deterministic engine mode',
        maskedKey,
        fallbackActive: true,
      }
    }

    try {
      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(Math.min(AI_CONFIG.timeoutMs, 8000)),
      })

      if (response.ok) {
        return {
          configured: true,
          provider: 'groq',
          model,
          reachable: true,
          category: 'connected',
          message: `Groq AI API connected and verified with model "${model}"`,
          maskedKey,
          fallbackActive: false,
        }
      }

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
        provider: 'groq',
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
        provider: 'groq',
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
