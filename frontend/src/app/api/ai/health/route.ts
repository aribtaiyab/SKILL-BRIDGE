import { NextResponse } from 'next/server'
import { AI_CONFIG } from '@/lib/ai/config'

function maskKey(key?: string): string {
  const k = (key || '').trim()
  if (!k) return '[UNCONFIGURED]'
  if (k.length <= 8) return '****'
  return `${k.slice(0, 4)}...${k.slice(-4)}`
}

export async function GET() {
  const isConfigured = AI_CONFIG.isLiveProviderConfigured()
  const model = AI_CONFIG.model
  const maskedKey = maskKey(AI_CONFIG.apiKey)

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      provider: 'gemini',
      model,
      reachable: false,
      category: 'unconfigured',
      message: 'GEMINI_API_KEY is not configured in frontend/.env.local; running in deterministic engine mode',
      maskedKey,
      fallbackActive: true,
    })
  }

  try {
    const apiKey = AI_CONFIG.apiKey
    const url = `${AI_CONFIG.baseUrl}/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
      signal: AbortSignal.timeout(6000),
    })

    if (res.ok) {
      return NextResponse.json({
        configured: true,
        provider: 'gemini',
        model,
        reachable: true,
        category: 'connected',
        message: `Google Gemini API successfully connected and verified with model "${model}"`,
        maskedKey,
        fallbackActive: false,
      })
    }

    let rawMessage = ''
    try {
      const errBody = await res.json()
      rawMessage = errBody?.error?.message || ''
    } catch {}

    const isQuota = res.status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('quota')
    const isModelUnavailable = res.status === 404 || rawMessage.includes('no longer available') || rawMessage.includes('is not found')
    const isAuth = res.status === 401 || res.status === 403

    const category = isQuota
      ? 'daily_quota_exhausted'
      : isModelUnavailable
      ? 'model_unavailable'
      : isAuth
      ? 'auth_error'
      : 'server_error'

    return NextResponse.json({
      configured: true,
      provider: 'gemini',
      model,
      reachable: false,
      category,
      message: isQuota
        ? 'Gemini quota reached. Deterministic fallback engine is actively handling requests.'
        : isModelUnavailable
        ? `Model "${model}" unavailable for this account. Set GEMINI_MODEL=gemini-3.6-flash.`
        : `Gemini API responded with status ${res.status}`,
      maskedKey,
      fallbackActive: true,
    })
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      provider: 'gemini',
      model,
      reachable: false,
      category: 'timeout',
      message: `Gemini connection test failed: ${err?.message || 'Network error'}. Fallback active.`,
      maskedKey,
      fallbackActive: true,
    })
  }
}
