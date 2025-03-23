"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Beaker, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Register() {
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userType, setUserType] = useState("patient")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegistrationComplete(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
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
          </div>
        </div>
      </header>
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Create an Account</h1>
            </div>

            {!registrationComplete ? (
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Join the FDA.gov v2 platform to participate in or create clinical trials
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
            ) : (
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
                  <Link
                    href={userType === "patient" ? "/patient/dashboard" : "/sponsor/create-trial"}
                    className="w-full"
                  >
                    <Button className="w-full">
                      {userType === "patient" ? "Go to Patient Dashboard" : "Create Your First Trial"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

