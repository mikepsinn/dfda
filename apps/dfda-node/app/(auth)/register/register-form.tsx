"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/components/demo-login-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth"
import { logger } from "@/lib/logger"

export function RegisterForm() {
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userType, setUserType] = useState("patient")
  const [error, setError] = useState<{ type: 'email_not_confirmed' | 'other' | null; message: string | null }>({ 
    type: null, 
    message: null 
  })

  const handleError = (error: { type: 'email_not_confirmed' | 'other', message: string }) => {
    setError({ type: error.type, message: error.message })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError({ type: null, message: null })
    
    const formData = new FormData(e.target)
    let email = ""
    let password = ""

    if (userType === 'patient') {
      email = formData.get('email') as string
      password = formData.get('password') as string
    } else if (userType === 'research-partner') {
      email = formData.get('research-partner-email') as string
      password = formData.get('research-partner-password') as string
    } else if (userType === 'developer') {
      email = formData.get('developer-email') as string
      password = formData.get('developer-password') as string
    }
    
    try {
      const { error: signUpError } = await signUpWithEmail(email, password)
      
      if (signUpError) {
        if (signUpError.message.includes('email not confirmed')) {
          setError({
            type: 'email_not_confirmed',
            message: 'Please check your email to complete registration. You will need to verify your email address before signing in.'
          })
        } else {
          setError({
            type: 'other',
            message: 'An error occurred during registration. Please contact help@dfda.earth for assistance.'
          })
        }
        return
      }
      
      setRegistrationComplete(true)
    } catch (err) {
      logger.error("Registration error:", err)
      setError({
        type: 'other',
        message: 'An error occurred during registration. Please contact help@dfda.earth for assistance.'
      })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error: signInError } = await signInWithGoogle()
      
      if (signInError) {
        setError({
          type: 'other',
          message: 'An error occurred during Google sign in. Please contact help@dfda.earth for assistance.'
        })
        return
      }
      
      // Google OAuth will redirect to callback URL
    } catch (err) {
      logger.error("Google sign-in error:", err)
      setError({
        type: 'other',
        message: 'An error occurred during Google sign in. Please contact help@dfda.earth for assistance.'
      })
    }
  }

  if (registrationComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Complete</CardTitle>
          <CardDescription>Your account has been created successfully</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Welcome to FDA.gov v2!</h3>
          <p className="text-center text-muted-foreground mb-6">
            {userType === "patient"
              ? "Your patient account has been created. You can now find and join clinical trials."
              : userType === "research-partner"
              ? "Your research partner account has been created. You can now create and manage clinical trials."
              : "Your developer account has been created. You can now manage your API keys and applications."}
          </p>
          <Link href={
            userType === "patient" ? "/patient/dashboard" :
            userType === "research-partner" ? "/research-partner/create-trial" :
            "/developer"
          } className="w-full">
            <Button className="w-full">
              {userType === "patient" ? "Go to Patient Dashboard" :
               userType === "research-partner" ? "Create Your First Trial" :
               "Go to Developer Dashboard"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Join the FDA.gov v2 platform to participate in or create clinical trials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.message && (
          <Alert variant={error.type === 'email_not_confirmed' ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
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

        <DemoLoginButton onError={handleError} />

        <Tabs defaultValue="patient" onValueChange={setUserType} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="research-partner">Research Partner</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Create Patient Account
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="research-partner" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="research-partner-email">Email</Label>
                <Input id="research-partner-email" name="research-partner-email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="research-partner-password">Password</Label>
                <Input id="research-partner-password" name="research-partner-password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Create Research Partner Account
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="developer" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="developer-email">Email</Label>
                <Input id="developer-email" name="developer-email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer-password">Password</Label>
                <Input id="developer-password" name="developer-password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Create Developer Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
