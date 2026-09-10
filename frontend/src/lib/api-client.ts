/**
 * SkillBridge Unified Frontend API Client
 *
 * Automatically resolves the backend API URL. If NEXT_PUBLIC_API_URL is empty
 * or relative, it uses relative endpoints (/api/...) directly handled by Next.js route handlers.
 * Attaches active Supabase auth tokens and localStorage fallback tokens.
 */

import { supabase } from './supabase/client'

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
// If configuredApiUrl points to localhost in production, or is empty, use relative base ""
const isLocalhostInProd =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  configuredApiUrl?.includes('localhost')

const API_BASE_URL = (configuredApiUrl && !isLocalhostInProd)
  ? configuredApiUrl.replace(/\/$/, '')
  : ''

const DEFAULT_REQUEST_TIMEOUT_MS = 15000

let cachedToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  timeoutMs?: number
}

async function getAuthToken(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined

  // 1. Check in-memory cache
  if (cachedToken) return cachedToken

  // 2. Check localStorage
  const stored = localStorage.getItem('sb_access_token')
  if (stored) {
    cachedToken = stored
    return stored
  }

  // 3. Fallback to Supabase getSession
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        cachedToken = session.access_token
        localStorage.setItem('sb_access_token', session.access_token)
        return session.access_token
      }
    }
  } catch {
    // ignore
  }

  return undefined
}

export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, headers = {}, timeoutMs, ...customConfig } = options

  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  // Build URL with query params
  let url = `${API_BASE_URL}${cleanEndpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const authToken = await getAuthToken()

  // Check demo mode cookie
  let isDemo = false
  let demoRole: string | null = null
  if (typeof document !== 'undefined') {
    isDemo = document.cookie.includes('sb_demo_mode=true')
    const match = document.cookie.match(/sb_demo_role=([^;]+)/)
    if (match) demoRole = decodeURIComponent(match[1])
  }
  if (typeof window !== 'undefined' && !demoRole) {
    demoRole = sessionStorage.getItem('sb_demo_role')
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(isDemo ? { 'x-demo-mode': 'true' } : {}),
    ...(demoRole ? { 'x-demo-role': demoRole } : {}),
    ...(headers as Record<string, string>),
  }

  const timeoutDuration = timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

  const executeFetch = async (targetUrl: string) => {
    const controller = new AbortController()
    const timeout = typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), timeoutDuration)
      : undefined
    const abortHandler = () => controller.abort()
    customConfig.signal?.addEventListener('abort', abortHandler, { once: true })

    try {
      return await fetch(targetUrl, {
        ...customConfig,
        headers: reqHeaders,
        credentials: 'include',
        signal: controller.signal,
      })
    } finally {
      if (timeout) clearTimeout(timeout)
      customConfig.signal?.removeEventListener('abort', abortHandler)
    }
  }

  // Construct local fallback URL
  let localUrl = cleanEndpoint
  if (params) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) sp.append(key, String(val))
    })
    const qs = sp.toString()
    if (qs) localUrl += `?${qs}`
  }

  let response: Response
  try {
    response = await executeFetch(url)
    // If external backend returned 404 or 5xx server error, attempt local Next.js route fallback
    if ((response.status === 404 || response.status >= 500) && API_BASE_URL && typeof window !== 'undefined') {
      try {
        const fallbackRes = await executeFetch(localUrl)
        if (fallbackRes.ok) {
          response = fallbackRes
        }
      } catch {
        // Keep original response if fallback failed
      }
    }
  } catch (error: any) {
    // If request was aborted due to timeout, immediately throw clear timeout error (never do slow sequential fallback)
    if (error?.name === 'AbortError') {
      throw new Error('The request timed out. Please check your connection or retry.')
    }

    // If external API_BASE_URL failed with connection refused / network error, fallback to local Next.js handler
    if (API_BASE_URL && typeof window !== 'undefined') {
      try {
        response = await executeFetch(localUrl)
      } catch (fallbackError: any) {
        if (fallbackError?.name === 'AbortError') {
          throw new Error('The request timed out. Please check your connection or retry.')
        }
        throw new Error('Network error. Please check your connection and try again.')
      }
    } else {
      throw new Error('Network error. Please check your connection and try again.')
    }
  }

  // Handle 401 with deduplicated token refresh
  if (response.status === 401 && typeof window !== 'undefined' && !isDemo && supabase) {
    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { data: refreshed } = await supabase.auth.refreshSession()
          const newToken = refreshed.session?.access_token || null
          if (newToken) {
            cachedToken = newToken
            localStorage.setItem('sb_access_token', newToken)
          }
          return newToken
        })().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise
      if (newToken) {
        reqHeaders.Authorization = `Bearer ${newToken}`
        response = await executeFetch(url)
      }
    } catch {
      // ignore refresh errors
    }
  }

  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`
    try {
      const errorJson = await response.json()
      if (errorJson.error) {
        errorMsg = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error)
      }
    } catch {
      // ignore json parse error on failed response
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

apiClient.get = <T = any>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' })

apiClient.post = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined })

apiClient.patch = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined })

apiClient.put = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined })

apiClient.delete = <T = any>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' })
