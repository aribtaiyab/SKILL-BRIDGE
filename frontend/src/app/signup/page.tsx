"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2, GraduationCap, Briefcase, Users } from "lucide-react"
import { signUpAction } from "@/lib/auth/actions"
import { supabase } from "@/lib/supabase/client"

function PasswordStrengthBar({ password }: { password: string }) {
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length

  if (!password) return null

  const labels = ['Weak', 'Fair', 'Strong']
  const colors = ['bg-[var(--color-critical)]', 'bg-[var(--color-warning)]', 'bg-emerald-400']

  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Strength: <span className="font-semibold text-[var(--color-text-secondary)]">{labels[strength - 1] || 'Too weak'}</span>
        {!hasMinLength && ' — at least 8 characters'}
      </p>
    </div>
  )
}

const roleLabels: Record<string, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  student: { label: "Student", icon: GraduationCap, color: "text-emerald-400" },
  industry: { label: "Industry", icon: Briefcase, color: "text-violet-400" },
  academician: { label: "Academia", icon: Users, color: "text-sky-400" },
  academia: { label: "Academia", icon: Users, color: "text-sky-400" },
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || ''
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")

  const roleInfo = roleParam ? roleLabels[roleParam.toLowerCase()] : null

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const confirmPassword = String(formData.get('confirmPassword') || '')
    const pwd = String(formData.get('password') || '')
    const email = String(formData.get('email') || '').trim()

    if (pwd !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    startTransition(async () => {
      const result = await signUpAction(formData)
      if (result.success) {
        try {
          await supabase.auth.signInWithPassword({ email, password: pwd })
        } catch {}
        router.replace(result.redirectTo || '/select-role')
        router.refresh()
      } else {
        setError(result.error || 'Sign up failed. Please try again.')
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
          <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
          {roleInfo ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/6 border border-white/8 px-3 py-1">
              <roleInfo.icon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Signing up as {roleInfo.label}</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5">Join SkillBridge Connect to get started</p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 text-sm text-[var(--color-critical)]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {roleParam && <input type="hidden" name="role" value={roleParam} />}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              placeholder="Jane Doe"
              required
              autoComplete="name"
              className="w-full h-11 px-4 text-sm input-dark rounded-xl"
            />
          </div>

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
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className="w-full h-11 px-4 pr-11 text-sm input-dark rounded-xl"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className={`w-full h-11 px-4 pr-11 text-sm input-dark rounded-xl ${fieldErrors.confirmPassword ? 'border-[var(--color-critical)]/50' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-[var(--color-critical)]">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 mt-2 rounded-xl btn-gradient text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isPending ? "Creating account..." : "Create Account"}</span>
          </button>
        </form>

        {/* Sign in link */}
        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <Link
            href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : "/login"}
            className="font-semibold text-[var(--color-accent)] hover:text-violet-300 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-indigo-500/8 blur-[80px]" />

      <div className="relative w-full max-w-[420px]">
        <Suspense fallback={
          <div className="glass-strong rounded-2xl border border-white/8 p-8 text-center text-sm text-[var(--color-text-muted)]">
            Loading...
          </div>
        }>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}