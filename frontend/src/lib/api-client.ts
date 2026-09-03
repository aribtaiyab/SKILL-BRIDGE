/**
 * SkillBridge Unified Frontend API Client
 *
 * Automatically resolves the backend API URL from NEXT_PUBLIC_API_URL,
 * attaches active Supabase auth tokens, and handles error states consistently.
 */

import { supabase } from './supabase/client'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

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

  // Retrieve auth token from Supabase client if available
  let authToken: string | undefined
  try {
    if (typeof window !== 'undefined' && supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      authToken = session?.access_token
    }
  } catch {
    // ignore session fetch errors
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

  const response = await fetch(url, {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'omit',
  })

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
