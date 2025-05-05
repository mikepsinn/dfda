"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from "next/link"
import { MailCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/components/demo-login-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerWithOtp, registerWithGoogle } from './actions'
import { InternalLink } from '@/components/internal-link'

export function RegisterForm() {
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<{ type: 'other' | null; message: string | null }>({
    type: null,
    message: null
  })
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    const message = searchParams.get('message');
    if (errorMessage) {
      setError({ type: 'other', message: decodeURIComponent(errorMessage) });
    }
    if (message) {
      setEmailSent(true);
      setError({ type: null, message: null });
    }
  }, [searchParams]);

  const handleError = (error: { type: 'email_not_confirmed' | 'other'; message: string }) => {
    setError({ type: 'other', message: error.message })
  }

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>We've sent a magic link to your email address.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-blue-100 p-3 mb-4">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Magic Link Sent!</h3>
          <p className="text-center text-muted-foreground"> 
            Click the link in the email to complete your sign in or registration. 
            You can close this window.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register or Sign In</CardTitle>
        <CardDescription>
          Enter your email to receive a magic link to sign in or create an account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.message && (
          <Alert variant={error.type === 'other' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        <form action={registerWithGoogle}>
        <Button
            type="submit"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
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
        </form>

        <div className="flex items-center gap-2 py-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <DemoLoginButton onError={handleError} showAll={true} />

        <form action={registerWithOtp} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="Enter your email address" />
          </div>
          <Button type="submit" className="w-full">
            Send Magic Link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="mt-6 text-center text-sm">
          Already have an account?
          <InternalLink navKey="login" className="ml-1 text-primary hover:underline">
            Sign in
          </InternalLink>
        </div>
         <div className="text-center text-sm text-muted-foreground">
          Need help? Contact <Link href="mailto:help@dfda.earth" className="underline">help@dfda.earth</Link>
        </div>
      </CardFooter>
    </Card>
  )
}
