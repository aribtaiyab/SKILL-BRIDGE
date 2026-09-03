"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react"
import { resetPasswordAction } from "@/lib/auth/actions"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
      } else if (!result.success) {
        setError(result.error || 'Password reset failed. Please try again.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Link>

        <Card>
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent)] text-white font-bold mb-2">
              SC
            </div>
            <CardTitle className="text-h2">Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                    placeholder="Min. 8 characters"
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

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isPending}>
                {isPending ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
