"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Beaker, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/public" className="flex items-center gap-2">
              <Beaker className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FDA.gov v2</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to login</span>
              </Link>
              <h1 className="text-2xl font-bold">Reset Password</h1>
            </div>

            {!submitted ? (
              <Card>
                <CardHeader>
                  <CardTitle>Forgot Your Password?</CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send you a link to reset your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Reset Link
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Back to login
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Check Your Email</CardTitle>
                  <CardDescription>We've sent password reset instructions to your email</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Email Sent</h3>
                  <p className="text-center text-muted-foreground mb-6">
                    We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
                    instructions to reset your password.
                  </p>
                  <div className="text-center text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button onClick={() => setSubmitted(false)} className="text-primary hover:underline">
                      try again
                    </button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Link href="/login">
                    <Button variant="outline">Back to Login</Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

