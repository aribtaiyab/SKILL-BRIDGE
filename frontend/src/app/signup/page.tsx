"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { signUpAction } from "@/lib/auth/actions"
import { supabase } from "@/lib/supabase/client"

function PasswordStrengthBar({ password }: { password: string }) {
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length

  if (!password) return null

  const labels = ['Weak', 'Fair', 'Strong']
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500']

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 font-medium">
        Strength: <span className="font-bold text-slate-700">{labels[strength - 1] || 'Too weak'}</span>
        {!hasMinLength && ' — minimum 8 characters required'}
      </p>
    </div>
  )
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
    <Card className="border-slate-200 shadow-xl bg-white/95 backdrop-blur-md">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm mb-2 shadow-sm shadow-emerald-600/20">
          SC
        </div>
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Create an account</CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500">Join SkillBridge Connect to start verified skill tracking.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {roleParam && <input type="hidden" name="role" value={roleParam} />}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="fullName">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Sarah Jenkins"
              required
              autoComplete="name"
              className="h-10 text-sm"
            />
          </div>

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
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className="pr-10 h-10 text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            <PasswordStrengthBar password={password} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className={`pr-10 h-10 text-sm ${fieldErrors.confirmPassword ? 'border-rose-300 focus:ring-rose-500/20' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs font-medium text-rose-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 rounded-xl" disabled={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs font-medium text-slate-500">
          Already have an account?{" "}
          <Link
            href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : "/login"}
            className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Suspense fallback={<Card><CardContent className="p-8 text-center text-xs font-medium text-slate-500">Loading sign up...</CardContent></Card>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}