"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, Shield, Zap } from "lucide-react"
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

        const result = await resolveLoginRedirectAction()
        if (!result.success) {
          setError(result.error || "You're signed in, but we couldn't load your account. Please refresh.")
          return
        }

        let dest = '/select-role'
        if (result.redirectTo && result.redirectTo !== '/select-role') {
          dest = result.redirectTo
        } else if (roleParam) {
          const normRole = roleParam.toLowerCase()
          if (normRole === 'academician' || normRole === 'academia' || normRole === 'institution') dest = '/academia'
          else if (normRole === 'industry') dest = '/industry'
          else if (normRole === 'student') dest = '/student'
          else dest = '/select-role'
        } else if (redirectTo) {
          dest = redirectTo
        } else {
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
    <div className="w-full max-w-[420px] mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors mb-8 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Home
      </Link>

      <div className="glass-strong rounded-2xl border border-white/8 p-8 shadow-[var(--shadow-float)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-indigo-500 text-white text-sm font-black shadow-lg mb-4">
            SC
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1.5">Sign in to continue to your portal</p>
        </div>

        {/* Success banner */}
        {resetSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password reset successful. Please sign in with your new password.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 text-sm text-[var(--color-critical)]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full h-11 px-4 text-sm input-dark rounded-xl"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-[var(--color-accent)] hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full h-11 px-4 pr-11 text-sm input-dark rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 mt-2 rounded-xl btn-gradient text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isPending ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        {/* Sign up link */}
        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href={roleParam ? `/signup?role=${encodeURIComponent(roleParam)}` : "/signup"}
            className="font-semibold text-[var(--color-accent)] hover:text-violet-300 transition-colors"
          >
            Create one free
          </Link>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex justify-center gap-6 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          Secure
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          Instant Access
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          AI-Powered
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-indigo-500/8 blur-[80px]" />

      <div className="relative w-full max-w-[420px]">
        <Suspense fallback={
          <div className="glass-strong rounded-2xl border border-white/8 p-8 text-center text-sm text-[var(--color-text-muted)]">
            Loading...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}