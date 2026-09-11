import { NextResponse } from 'next/server'
import { AI_CONFIG } from '@/lib/ai/config'

function maskKey(key?: string): string {
  const k = (key || '').trim()
  if (!k) return '[UNCONFIGURED]'
  if (k.length <= 8) return '****'
  return `${k.slice(0, 8)}...${k.slice(-4)}`
}

export async function GET() {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()
  const model = AI_CONFIG.model
  const maskedKey = maskKey(AI_CONFIG.apiKey)

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      provider: 'groq',
      model,
      reachable: false,
      category: 'unconfigured',
      message: 'GROQ_API_KEY is not configured in frontend/.env.local; running in deterministic engine mode',
      maskedKey,
      fallbackActive: true,
    })
  }

  try {
    const apiKey = AI_CONFIG.apiKey
    const url = `${AI_CONFIG.baseUrl}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(6000),
    })

    if (res.ok) {
      return NextResponse.json({
        configured: true,
        provider: 'groq',
        model,
        reachable: true,
        category: 'connected',
        message: `Groq AI API successfully connected and verified with model "${model}"`,
        maskedKey,
        fallbackActive: false,
      })
    }

    let rawMessage = ''
    try {
      const errBody = await res.json()
      rawMessage = errBody?.error?.message || errBody?.message || ''
    } catch {}

    const isQuota = res.status === 429 || rawMessage.includes('rate_limit') || rawMessage.includes('quota')
    const isModelUnavailable = res.status === 404 || rawMessage.includes('decommissioned') || rawMessage.includes('not found')
    const isAuth = res.status === 401 || res.status === 403 || rawMessage.includes('invalid_api_key')

    const category = isQuota
      ? 'rate_limited'
      : isModelUnavailable
      ? 'model_unavailable'
      : isAuth
      ? 'auth_error'
      : 'server_error'

    return NextResponse.json({
      configured: true,
      provider: 'groq',
      model,
      reachable: false,
      category,
      message: isQuota
        ? 'Groq rate limit or quota reached. Deterministic fallback engine is actively handling requests.'
        : isModelUnavailable
        ? `Model "${model}" unavailable or decommissioned for this account. Set GROQ_MODEL=openai/gpt-oss-120b.`
        : `Groq API responded with status ${res.status}: ${rawMessage || 'Request failed'}`,
      maskedKey,
      fallbackActive: true,
    })
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      provider: 'groq',
      model,
      reachable: false,
      category: 'timeout',
      message: `Groq connection test failed: ${err?.message || 'Network error'}. Fallback active.`,
      maskedKey,
      fallbackActive: true,
    })
  }
}
