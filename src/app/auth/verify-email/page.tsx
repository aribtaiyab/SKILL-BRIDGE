"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, Mail } from "lucide-react"
import { createAuthBrowserClient } from "@/lib/supabase/client"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [resent, setResent] = useState(false)
  const [email, setEmail] = useState(searchParams.get('email') || '')

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  const isConfirmed = Boolean(tokenHash && type === 'email')
  const isError = Boolean(error)

  const handleResend = () => {
    if (!email) return
    startTransition(async () => {
      const supabase = createAuthBrowserClient()
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
    })
  }

  if (isConfirmed) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-h2 font-semibold">Email verified!</h2>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Your email has been verified successfully. You can now sign in to your account.
          </p>
          <Link href="/login">
            <Button className="w-full mt-2">Continue to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-[var(--color-critical)]" />
          </div>
          <h2 className="text-h2 font-semibold">Verification failed</h2>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {errorDesc || 'The verification link is invalid or has expired.'}
          </p>
          <div className="space-y-2">
            <Link href="/login">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center">
          <Mail className="h-8 w-8 text-[var(--color-text-secondary)]" />
        </div>
        <h2 className="text-h2 font-semibold">Verify your email</h2>
        <p className="text-[var(--color-text-secondary)] text-sm">
          We sent a verification link to your email address. Click the link in the email to activate your account.
        </p>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] justify-center">
          <Clock className="h-3 w-3" />
          Check your spam folder if you don&apos;t see it
        </div>

        {resent ? (
          <div className="p-3 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] text-sm">
            Verification email resent! Check your inbox.
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-[var(--color-text-secondary)]">Didn&apos;t receive it?</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 h-9 rounded-md border border-[var(--color-border-primary)] bg-white px-3 text-sm placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={isPending || !email}
              >
                {isPending ? '...' : 'Resend'}
              </Button>
            </div>
          </div>
        )}

        <Link href="/login" className="block text-sm text-[var(--color-accent)] hover:underline pt-2">
          Back to Sign In
        </Link>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Suspense fallback={<Card><CardContent className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading verification status...</CardContent></Card>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
