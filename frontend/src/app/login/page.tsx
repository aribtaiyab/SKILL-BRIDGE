"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { resolveLoginRedirectAction } from "@/lib/auth/actions"
import { supabase } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const resetSuccess = searchParams.get('reset') === 'success'
  const redirectTo = searchParams.get('redirect') || null
  const roleParam = searchParams.get('role') || null

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    startTransition(async () => {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message || "Incorrect email or password.")
          return
        }

        if (!data.session) {
          setError("Login succeeded but your session could not be established. Please try again.")
          return
        }

        // Clear any lingering demo state upon authenticating a real account
        if (typeof window !== 'undefined') {
          document.cookie = 'sb_demo_mode=; path=/; max-age=0'
          document.cookie = 'sb_demo_role=; path=/; max-age=0'
          sessionStorage.removeItem('sb_demo_mode')
          sessionStorage.removeItem('sb_demo_role')
          localStorage.removeItem('sb_demo_mode')
          localStorage.removeItem('sb_demo_role')
        }

        const result = await resolveLoginRedirectAction()
        if (!result.success) {
          setError(result.error || "You're signed in, but we couldn't load your account. Please refresh.")
          return
        }

        let dest = '/select-role'
        // 1. Direct redirect parameter (e.g. user clicked /academia, /industry, or /student in navbar)
        if (redirectTo && !redirectTo.startsWith('/login') && !redirectTo.startsWith('/signup')) {
          dest = redirectTo
        } 
        // 2. Resolved destination based on user's database role/profile
        else if (result.redirectTo && result.redirectTo !== '/select-role') {
          dest = result.redirectTo
        } 
        // 3. Role parameter provided in query string
        else if (roleParam) {
          const normRole = roleParam.toLowerCase()
          if (normRole === 'academician' || normRole === 'academia' || normRole === 'institution' || normRole === 'faculty') dest = '/academia'
          else if (normRole === 'industry') dest = '/industry'
          else if (normRole === 'student') dest = '/student'
          else dest = '/select-role'
        } 
        // 4. Default fallback
        else {
          dest = result.redirectTo || '/select-role'
        }

        router.replace(dest)
        router.refresh()
      } catch {
        setError("Couldn't reach the server. Please check your connection and try again.")
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-xl bg-white/95 backdrop-blur-md">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm mb-2 shadow-sm shadow-emerald-600/20">
          SC
        </div>
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500">Enter your credentials to access your SkillBridge account.</CardDescription>
      </CardHeader>
      <CardContent>
        {resetSuccess && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            Password reset successful. Please sign in with your new password.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10 text-sm"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="pr-10 h-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 rounded-xl" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs font-medium text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href={roleParam ? `/signup?role=${encodeURIComponent(roleParam)}` : "/signup"}
            className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Suspense fallback={<Card><CardContent className="p-8 text-center text-xs font-medium text-slate-500">Loading login...</CardContent></Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}