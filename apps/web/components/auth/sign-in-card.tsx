"use client"

import { useState, type FormEvent } from 'react'
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/components/demo-login-button"
import { MailCheck, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InternalLink } from '@/components/internal-link'
import { authClient } from '@/lib/auth-client'
import { logger } from '@/lib/logger'

// Where the browser goes after a magic link or Google sign-in.
const AFTER_SIGN_IN = '/auth/callback'

/**
 * The URL to open after a magic link sign-in. During an OAuth authorization
 * the sign-in page has the provider's signed query; the link then returns to
 * the authorization endpoint, which continues to the consent page.
 */
function magicLinkCallbackUrl(searchParams: URLSearchParams): string {
  if (!searchParams.has('sig') || !searchParams.has('client_id')) return AFTER_SIGN_IN
  const query = new URLSearchParams(searchParams)
  for (const name of ['sig', 'exp', 'ba_iat', 'ba_pl']) query.delete(name)
  return `/api/auth/oauth2/authorize?${query.toString()}`
}

interface SignInCardProps {
  mode: 'login' | 'register'
  googleEnabled: boolean
}

/** The sign-in and registration form: magic link, Google, password and demo accounts. */
export function SignInCard({ mode, googleEnabled }: SignInCardProps) {
  const searchParams = useSearchParams()
  const [emailSent, setEmailSent] = useState(false)
  const [busy, setBusy] = useState<'magic' | 'google' | 'password' | null>(null)
  const [error, setError] = useState<string | null>(() => {
    const value = searchParams.get('error')
    return value ? decodeURIComponent(value) : null
  })
  const notice = searchParams.get('notice')

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    if (!email) return
    setBusy('magic')
    setError(null)
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: magicLinkCallbackUrl(searchParams),
      errorCallbackURL: `/login?error=${encodeURIComponent('The sign-in link is not valid or has expired. Please ask for a new one.')}`,
    })
    setBusy(null)
    if (error) {
      logger.warn('Magic link request failed', { status: error.status })
      setError('Could not send the sign-in link. Please try again.')
      return
    }
    setEmailSent(true)
  }

  async function signInWithGoogle() {
    setBusy('google')
    setError(null)
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: AFTER_SIGN_IN })
    if (error) {
      logger.warn('Google sign-in failed to start', { status: error.status })
      setError('Could not sign in with Google. Please try again.')
      setBusy(null)
    }
    // On success the browser goes to Google.
  }

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy('password')
    setError(null)
    const { error } = await authClient.signIn.email({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
      callbackURL: AFTER_SIGN_IN,
    })
    if (error) {
      setError(error.status === 401 ? 'The email or password is not correct.' : 'Could not sign in. Please try again.')
      setBusy(null)
    }
    // On success the client follows the redirect in the response: to
    // AFTER_SIGN_IN, or to the consent page during an OAuth authorization.
  }

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>We&apos;ve sent a magic link to your email address.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-blue-100 p-3 mb-4">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Magic Link Sent!</h3>
          <p className="text-center text-muted-foreground">
            Click the link in the email to complete your sign in. You can close this window.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Sign In' : 'Register or Sign In'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Enter your email to receive a magic link to sign in.'
            : 'Enter your email to receive a magic link to sign in or create an account.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {googleEnabled && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={signInWithGoogle}
              disabled={busy !== null}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-2 py-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        <DemoLoginButton showAll={true} onError={(err) => setError(err.message)} />

        <form onSubmit={sendMagicLink} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="Enter your email address" />
          </div>
          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === 'magic' ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>

        {mode === 'login' && (
          <details className="pt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground">Sign in with a password</summary>
            <form onSubmit={signInWithPassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="password-email">Email</Label>
                <Input id="password-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={busy !== null}>
                {busy === 'password' ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Forgot your password, or have none yet?
                </Link>
              </p>
            </form>
          </details>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="mt-6 text-center text-sm">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?
              <InternalLink navKey="register" className="ml-1 text-primary hover:underline">
                Register
              </InternalLink>
            </>
          ) : (
            <>
              Already have an account?
              <InternalLink navKey="login" className="ml-1 text-primary hover:underline">
                Sign in
              </InternalLink>
            </>
          )}
        </div>
        {mode === 'register' && (
          <div className="text-center text-sm text-muted-foreground">
            Need help? Contact <Link href="mailto:help@dfda.earth" className="underline">help@dfda.earth</Link>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
