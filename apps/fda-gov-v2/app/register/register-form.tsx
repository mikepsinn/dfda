"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/components/demo-login-button"

export function RegisterForm() {
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userType, setUserType] = useState("patient")

  const handleSubmit = (e) => {
    e.preventDefault()
    setRegistrationComplete(true)
  }

  const handleGoogleSignIn = () => {
    // In a real implementation, this would trigger Supabase Google OAuth
    console.log("Google sign in clicked")
    // For demo purposes, we'll just show the registration complete screen
    setRegistrationComplete(true)
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
              : "Your sponsor account has been created. You can now create and manage clinical trials."}
          </p>
          <Link href={userType === "patient" ? "/patient/dashboard" : "/sponsor/create-trial"} className="w-full">
            <Button className="w-full">
              {userType === "patient" ? "Go to Patient Dashboard" : "Create Your First Trial"}
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
            <TabsTrigger value="sponsor">Trial Sponsor</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label>Are you currently managing any health conditions?</Label>
                <RadioGroup defaultValue="yes">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="health-yes" />
                    <Label htmlFor="health-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="health-no" />
                    <Label htmlFor="health-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full">
                Create Patient Account
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="sponsor" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization-name">Organization Name</Label>
                <Input id="organization-name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Person</Label>
                <Input id="contact-name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-email">Email</Label>
                <Input id="sponsor-email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-password">Password</Label>
                <Input id="sponsor-password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label>Organization Type</Label>
                <RadioGroup defaultValue="pharma">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pharma" id="type-pharma" />
                    <Label htmlFor="type-pharma">Pharmaceutical Company</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="academic" id="type-academic" />
                    <Label htmlFor="type-academic">Academic Institution</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="research" id="type-research" />
                    <Label htmlFor="type-research">Research Organization</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="type-other" />
                    <Label htmlFor="type-other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full">
                Create Sponsor Account
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

