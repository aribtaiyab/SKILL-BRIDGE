"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { forgotPasswordAction } from "@/lib/auth/actions"

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    })
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
                <Mail className="h-8 w-8 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-h2 font-semibold">Check your email</h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                If an account with that email exists, we&apos;ve sent a password reset link. 
                Check your inbox and spam folder.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">Back to Sign In</Button>
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
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Link>

        <Card>
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent)] text-white font-bold mb-2">
              SC
            </div>
            <CardTitle className="text-h2">Forgot password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a reset link.
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
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email address
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

              <Button type="submit" className="w-full mt-6" disabled={isPending}>
                {isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              Remember your password?{" "}
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
