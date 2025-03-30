"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/components/demo-login-button"
import { signIn } from "next-auth/react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("login-form")

export function LoginForm() {
  const [userType, setUserType] = useState("patient")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    logger.info("Login attempt", { userType })
    
    try {
      const email = e.currentTarget.querySelector("input[type='email']")?.value
      const password = e.currentTarget.querySelector("input[type='password']")?.value
      
      const user = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (user?.ok) {
        logger.info("Login successful", { userType })
        setLoading(false)
        window.location.href = userType === "patient" ? "/patient/dashboard" : "/research-partner/create-trial"
      } else {
        logger.error("Login failed - invalid credentials", { userType })
        setError("Invalid credentials")
        setLoading(false)
      }
    } catch (error) {
      logger.error("Login error", { error, userType })
      setError("Something went wrong")
      setLoading(false)
      window.location.href = userType === "patient" ? "/patient/dashboard" : "/research-partner/create-trial"
    }
  }

  const handleGoogleSignIn = () => {
    // In a real implementation, this would trigger Supabase Google OAuth
    console.log("Google sign in clicked")
    // For demo purposes, we'll just redirect to the dashboard
    window.location.href = userType === "patient" ? "/patient/dashboard" : "/research-partner/create-trial"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your FDA.gov v2 account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Sign In Button */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
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

        <div className="flex items-center gap-2 py-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <DemoLoginButton />

        <Tabs defaultValue="patient" onValueChange={setUserType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="research-partner">Research Partner</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Sign In as Patient
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="research-partner" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="research-partner-email">Email</Label>
                <Input id="research-partner-email" type="email" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="research-partner-password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="research-partner-password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Sign In as Research Partner
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

