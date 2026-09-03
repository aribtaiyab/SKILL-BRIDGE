import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/student', '/industry', '/academician', '/institution']

// Routes that are only for unauthenticated users
const AUTH_ONLY_ROUTES = ['/login', '/signup']

// Routes that are always public
const PUBLIC_ROUTES = ['/', '/how-it-works', '/product']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth middleware (dev without credentials)
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

  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const isAuthOnly = AUTH_ONLY_ROUTES.some(route => pathname === route)

  // Unauthenticated user → redirect to login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user on auth-only route → redirect to dashboard
  if (isAuthOnly && user) {
    // We can't easily read the role from session here without a DB call
    // So redirect to a smart redirect endpoint, or just to /student as fallback
    // The actual role-based redirect happens in the auth actions
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Role-based protection — students can't access /industry, etc.
  // This is an optimistic check based on URL; real authorization is in each page/API
  if (user && isProtected) {
    const rolePrefix = PROTECTED_PREFIXES.find(prefix => pathname.startsWith(prefix))
    // We cannot check DB role in middleware efficiently, so we rely on 
    // each layout/page to enforce role boundaries with server-side checks
    // Middleware only prevents unauthenticated access here
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
