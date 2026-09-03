import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/student', '/industry', '/academician', '/institution']

// Routes that are only for unauthenticated users
const AUTH_ONLY_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  // Check if the route is protected or auth-only
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const isAuthOnly = AUTH_ONLY_ROUTES.some(route => pathname === route)

  // 1. Check if in Demo Mode (via cookie or query param)
  const isDemo =
    request.cookies.get('sb_demo_mode')?.value === 'true' ||
    request.nextUrl.searchParams.get('demo') === 'true'

  // If in demo mode and visiting a protected route, allow access through without redirecting to login
  if (isDemo && isProtected) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth middleware
  if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl === 'https://your-project.supabase.co') {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important for Server Components to pick up updated tokens
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated user attempting to access protected route → redirect to login
  if (isProtected && !user && !isDemo) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Authenticated user on auth-only route (/login, /signup) → redirect to appropriate dashboard
  if (isAuthOnly && user) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/student'
    const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
