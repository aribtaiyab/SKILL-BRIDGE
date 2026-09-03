"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { signUpAction } from "@/lib/auth/actions"

function PasswordStrengthBar({ password }: { password: string }) {
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length

  if (!password) return null

  const labels = ['Weak', 'Fair', 'Good']
  const colors = ['bg-[var(--color-critical)]', 'bg-[var(--color-warning)]', 'bg-[var(--color-success)]']

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-[var(--color-border-primary)]'}`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        Strength: <span className="font-medium">{labels[strength - 1] || 'Too weak'}</span>
        {!hasMinLength && ' — must be at least 8 characters'}
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const confirmPassword = String(formData.get('confirmPassword') || '')
    const pwd = String(formData.get('password') || '')

    // Client-side confirm password check for UX
    if (pwd !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    startTransition(async () => {
      const result = await signUpAction(formData)
      if (result.success) {
        if (result.redirectTo === '/auth/verify-email') {
          setSuccess(true)
          setSuccessMessage('Account created! Please check your email to verify your account before signing in.')
        } else {
          router.push(result.redirectTo || '/onboarding')
          router.refresh()
        }
      } else {
        setError(result.error || 'Sign up failed. Please try again.')
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-h2 font-semibold">Check your email</h2>
              <p className="text-[var(--color-text-secondary)] text-sm">{successMessage}</p>
              <Link href="/auth/verify-email">
                <Button variant="outline" className="w-full mt-4">Go to verification page</Button>
              </Link>
              <Link href="/login" className="block text-sm text-[var(--color-accent)] hover:underline">
                Back to sign in
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent)] text-white font-bold mb-2">
              SC
            </div>
            <CardTitle className="text-h2">Create an account</CardTitle>
            <CardDescription>Join SkillBridge Connect to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="fullName">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                />
              </div>

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
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                <PasswordStrengthBar password={password} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className={`pr-10 ${fieldErrors.confirmPassword ? 'border-[var(--color-critical)] focus-visible:ring-[var(--color-critical)]' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-[var(--color-critical)]">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isPending}>
                {isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}