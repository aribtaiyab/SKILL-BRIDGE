/**
 * SkillBridge Unified Frontend API Client
 *
 * Automatically resolves the backend API URL from NEXT_PUBLIC_API_URL,
 * attaches active Supabase auth tokens, and handles error states consistently.
 */

import { supabase } from './supabase/client'

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
const API_BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : ''
const REQUEST_TIMEOUT_MS = 15000

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options

  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (!API_BASE_URL) {
    throw new Error(
      process.env.NODE_ENV === 'production'
        ? 'The application API is not configured. Please contact support.'
        : 'The local API is not configured. Set NEXT_PUBLIC_API_URL and restart the frontend.'
    )
  }
  
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

  // Retrieve auth token from Supabase client if available
  let authToken: string | undefined
  let hasSession = false
  try {
    if (typeof window !== 'undefined' && supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      authToken = session?.access_token
      hasSession = Boolean(session)
    }
  } catch {
    // ignore session fetch errors
  }

  // Check demo mode cookie
  let isDemo = false
  if (typeof document !== 'undefined') {
    isDemo = document.cookie.includes('sb_demo_mode=true')
  }

  const isProtectedEndpoint = /^\/api\/(student|ai|applications|verification|passport)(\/|$)/.test(cleanEndpoint) ||
    /^\/api\/opportunities\/[^/]+\/(readiness|proof|save)$/.test(cleanEndpoint)
  if (typeof window !== 'undefined' && isProtectedEndpoint && !hasSession && !isDemo) {
    const redirect = `${window.location.pathname}${window.location.search}`
    window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
    throw new Error('Authentication required')
  }

  let reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(isDemo ? { 'x-demo-mode': 'true' } : {}),
    ...(headers as Record<string, string>),
  }

  const request = async () => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const abortHandler = () => controller.abort()
    customConfig.signal?.addEventListener('abort', abortHandler, { once: true })

    try {
      return await fetch(url, {
        ...customConfig,
        headers: reqHeaders,
        credentials: 'omit',
        signal: controller.signal,
      })
    } finally {
      window.clearTimeout(timeout)
      customConfig.signal?.removeEventListener('abort', abortHandler)
    }
  }

  let response: Response
  try {
    response = await request()
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.')
    throw new Error('Network error. Please check your connection and try again.')
  }

  if (response.status === 401 && typeof window !== 'undefined' && !isDemo) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      reqHeaders = { ...reqHeaders, Authorization: `Bearer ${refreshed.session.access_token}` }
      response = await request()
    }
  }

  if (response.status === 401 && typeof window !== 'undefined' && !isDemo) {
    const redirect = `${window.location.pathname}${window.location.search}`
    window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
    throw new Error('Your session expired. Please sign in again.')
  }

  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`
    try {
      const errorJson = await response.json()
      if (errorJson.error) {
        errorMsg = errorJson.error
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
