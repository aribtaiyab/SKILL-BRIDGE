"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { signInAction } from "@/lib/auth/actions"
import { createAuthBrowserClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const resetSuccess = searchParams.get('reset') === 'success'
  const redirectTo = searchParams.get('redirect') || null

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    startTransition(async () => {
      try {
        // 1. Authenticate with browser Supabase client to set cookies and fire client listeners
        const supabase = createAuthBrowserClient()
        const { error: clientError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (clientError) {
          setError(clientError.message || "Sign in failed. Please check your credentials.")
          return
        }

        // 2. Also run server action to verify onboarding status and get dashboard URL
        const result = await signInAction(formData)
        const dest = redirectTo || (result.success && result.redirectTo ? result.redirectTo : '/student')
        
        router.push(dest)
        router.refresh()
      } catch {
        setError("Sign in failed. Please try again.")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent)] text-white font-bold mb-2">
          SC
        </div>
        <CardTitle className="text-h2">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {resetSuccess && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] text-sm border border-[var(--color-accent)]/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password reset successful. Please sign in with your new password.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
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
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--color-accent)] font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Suspense fallback={<Card><CardContent className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading login...</CardContent></Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}