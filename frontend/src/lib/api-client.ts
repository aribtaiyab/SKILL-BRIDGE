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

const REQUEST_TIMEOUT_MS = 15000

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options

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

  // Retrieve auth token from Supabase client or localStorage
  let authToken: string | undefined
  try {
    if (typeof window !== 'undefined' && supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      authToken = session?.access_token
      if (authToken) {
        localStorage.setItem('sb_access_token', authToken)
      }
    }
  } catch {
    // ignore session fetch error
  }

  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('sb_access_token') || undefined
  }

  // Check demo mode cookie
  let isDemo = false
  if (typeof document !== 'undefined') {
    isDemo = document.cookie.includes('sb_demo_mode=true')
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(isDemo ? { 'x-demo-mode': 'true' } : {}),
    ...(headers as Record<string, string>),
  }

  const request = async () => {
    const controller = new AbortController()
    const timeout = typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      : undefined
    const abortHandler = () => controller.abort()
    customConfig.signal?.addEventListener('abort', abortHandler, { once: true })

    try {
      return await fetch(url, {
        ...customConfig,
        headers: reqHeaders,
        credentials: 'same-origin',
        signal: controller.signal,
      })
    } finally {
      if (timeout) clearTimeout(timeout)
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

  if (response.status === 401 && typeof window !== 'undefined' && !isDemo && supabase) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession()
      if (refreshed.session?.access_token) {
        reqHeaders.Authorization = `Bearer ${refreshed.session.access_token}`
        localStorage.setItem('sb_access_token', refreshed.session.access_token)
        response = await request()
      }
    } catch {
      // ignore
    }
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
